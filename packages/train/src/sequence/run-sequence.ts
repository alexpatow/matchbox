import { sameOutput } from "./same-output.js";
import { z } from "zod";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createSequenceParser, readSequenceArtifact, tokenize } from "@matchbox-ai/core/runtime";
import type { DatasetExample } from "@matchbox-ai/core";
import type { MatchboxParser, SequenceDecoder } from "@matchbox-ai/core/runtime";
import type { loadProject } from "../load-project.js";
import { packageModel } from "../package-model.js";
import { fitSequence } from "./fit-sequence.js";
import { evaluateSequence as evaluate } from "./evaluate-sequence.js";
import type { SequenceRecipe } from "./types.js";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export async function runSequence(
  command: "train" | "eval",
  project: Awaited<ReturnType<typeof loadProject>>,
  configPath: string,
) {
  const { task, config } = project;
  const root = dirname(resolve(configPath));
  const sequence = config.sequence!;
  const decode: SequenceDecoder = (
    await import(pathToFileURL(resolve(root, sequence.decoder)).href)
  ).default;
  const evaluateSequence = (
    parser: MatchboxParser<unknown>,
    examples: readonly DatasetExample<unknown>[],
  ) => evaluate(parser, examples, (value) => task.validateOutput(value).success);
  const parser = (artifact: unknown) => createSequenceParser(artifact, task, decode);
  if (command === "eval") {
    const artifact = readSequenceArtifact(JSON.parse(await readFile(project.output, "utf8")));
    console.log(
      JSON.stringify(await evaluateSequence(parser(artifact), project.evaluation), null, 2),
    );
    return;
  }
  const recipe: SequenceRecipe = (await import(pathToFileURL(resolve(root, sequence.recipe)).href))
    .default;
  const modulePath = (path: string) => {
    const value = relative(dirname(project.output), path).replaceAll("\\", "/");
    return value.startsWith(".") ? value : `./${value}`;
  };
  for (const example of project.train) {
    const tokens = tokenize(example.input, recipe.tokenizer);
    const labels = recipe.annotate(example, tokens);
    const value = decode(
      tokens.map((token, index) => ({ ...token, label: labels[index] ?? "O", confidence: 1 })),
      example.input,
    );
    if (!sameOutput(value, example.output))
      throw new Error(
        `Training annotations do not decode to the supplied output: ${example.input}`,
      );
  }
  const started = performance.now();
  const fit = await fitSequence(
    project.train,
    recipe,
    {
      taskMetadata: task.toJSON(),
      taskModule: modulePath(project.taskPath),
      decoderModule: modulePath(resolve(root, sequence.decoder)),
    },
    project.validation.map((row) => row.input),
  );
  const validation = await evaluateSequence(parser(fit.quantized), project.validation);
  const bytes = Buffer.byteLength(JSON.stringify(fit.quantized));
  if (validation.exactAccuracy < config.minAccuracy || bytes > config.maxBytes)
    throw new Error(
      `Sequence model failed validation/size requirements (${validation.exactAccuracy}, ${bytes} bytes). ${JSON.stringify(validation.failures.slice(0, 10))}`,
    );
  const shuffledControl =
    recipe.readout === "last"
      ? await fitSequence(project.train, recipe, fit.quantized, [], true)
      : null;
  const challenges = config.challenges
    ? z
        .array(z.strictObject({ input: z.string(), output: z.null() }))
        .min(1)
        .parse(JSON.parse(await readFile(resolve(root, config.challenges), "utf8")))
    : null;
  const report = {
    formatVersion: 1,
    architecture: fit.quantized.architecture,
    backend: "TensorFlow native CPU",
    seed: 42,
    artifactSha256: hash(JSON.stringify(fit.quantized)),
    bytes,
    parameters: fit.quantized.weights.reduce((sum, weight) => sum + weight.values.length, 0),
    datasetSha256: project.sources.map((source) => ({
      source: source.source,
      sha256: hash(source.text),
    })),
    examples: {
      train: project.train.length,
      validation: project.validation.length,
      eval: project.evaluation.length,
    },
    shuffledLabelsUngated: shuffledControl
      ? await evaluateSequence(
          parser({ ...shuffledControl.quantized, threshold: 0 }),
          project.evaluation,
        )
      : null,
    supervisedTokens: fit.supervisedTokens,
    loss: fit.history,
    exportParity: fit.parity,
    validation,
    untrainedUngated: await evaluateSequence(
      parser({ ...fit.untrained, threshold: 0 }),
      project.evaluation,
    ),
    untrained: await evaluateSequence(parser(fit.untrained), project.evaluation),
    float: await evaluateSequence(parser(fit.float), project.evaluation),
    quantized: await evaluateSequence(parser(fit.quantized), project.evaluation),
    challenges: challenges ? await evaluateSequence(parser(fit.quantized), challenges) : null,
    baseline: await evaluateSequence(project.baseline, project.evaluation),
    trainingMs: performance.now() - started,
    notes:
      "Validation gates export. Eval labels do not influence selection. Scores are uncalibrated. Unknown tokens abstain. JSON int8 arrays are portable but not a packed binary format.",
  };
  await packageModel(project.output, fit.quantized, report);
  console.log(
    `${fit.quantized.architecture}: ${report.parameters} parameters, ${bytes} bytes, eval ${(report.quantized.exactAccuracy * 100).toFixed(1)}%, untrained ${(report.untrained.exactAccuracy * 100).toFixed(1)}%.`,
  );
}
