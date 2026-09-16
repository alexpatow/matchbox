import { sameOutput } from "../../evaluation/same-output.js";
import { z } from "zod";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createParser } from "@matchbox-ai/core/runtime";
import { readSequenceArtifact, tokenize } from "@matchbox-ai/core/internal";
import type { DatasetExample } from "@matchbox-ai/core";
import type { MatchboxParser, SequenceDecoder } from "@matchbox-ai/core/runtime";
import type { loadProject } from "../../load-project.js";
import { packageModel } from "../../packaging/package-model.js";
import { fitSequence } from "./fit-sequence.js";
import { evaluateSequence as evaluate } from "../../evaluation/evaluate-sequence.js";
import type { SequenceRecipe } from "./types.js";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export async function runSequence(
  command: "train" | "eval",
  project: Awaited<ReturnType<typeof loadProject>>,
  progress?: (epoch: number, loss: number) => void,
) {
  const { task, config } = project;
  const root = project.root;
  const sequence = config.sequence;
  if (!sequence) {
    throw new Error("A sequence pipeline needs both recipe and decoder modules.");
  }
  const savedArtifact =
    command === "eval"
      ? readSequenceArtifact(JSON.parse(await readFile(project.output, "utf8")))
      : null;
  const decoderPath = savedArtifact
    ? resolve(dirname(project.output), savedArtifact.decoderModule)
    : resolve(root, sequence.decoder);
  const decode: SequenceDecoder = (await import(pathToFileURL(decoderPath).href)).default;
  const evaluateSequence = (
    parser: MatchboxParser<unknown>,
    examples: readonly DatasetExample<unknown>[],
  ) =>
    evaluate(parser, examples, (value) => task.validateOutput(value).success).finally(() => {
      if ("dispose" in parser && typeof parser.dispose === "function") {
        parser.dispose();
      }
    });
  const parser = (artifact: unknown) => createParser(artifact, task, decode);
  if (savedArtifact) {
    return { evaluation: await evaluateSequence(parser(savedArtifact), project.evaluation) };
  }
  const recipe: SequenceRecipe = (await import(pathToFileURL(resolve(root, sequence.recipe)).href))
    .default;
  const modulePath = (path: string) => {
    const value = relative(dirname(project.output), path).replaceAll("\\", "/");
    return value.startsWith(".") ? value : `./${value}`;
  };
  const rejections = z
    .array(z.strictObject({ input: z.string(), output: z.null() }))
    .parse(recipe.rejections ?? []);
  const training = [...project.train, ...rejections];
  const heldOut = new Set(
    [...project.validation, ...project.evaluation].map((row) => row.input.trim().toLowerCase()),
  );
  for (const example of training) {
    if (!task.validateInput(example.input).success) {
      throw new Error(`Invalid training input: ${example.input}`);
    }
    if (heldOut.has(example.input.trim().toLowerCase())) {
      throw new Error(`Training input overlaps evaluation: ${example.input}`);
    }
    const tokens = tokenize(example.input, recipe.tokenizer, recipe.casing);
    const labels = recipe.annotate(example, tokens);
    const value = decode(
      tokens.map((token, index) => ({ ...token, label: labels[index] ?? "O", confidence: 1 })),
      example.input,
    );
    if (!sameOutput(value, example.output)) {
      throw new Error(
        `Training annotations do not decode to the supplied output: ${example.input}`,
      );
    }
  }
  const started = performance.now();
  const fit = await fitSequence(
    training,
    recipe,
    {
      taskMetadata: task.toJSON(),
      taskModule: modulePath(project.taskPath),
      decoderModule: modulePath(resolve(root, sequence.decoder)),
    },
    project.validation.map((row) => row.input),
    progress,
    sequence.contextRadius,
  );
  const validation = await evaluateSequence(parser(fit.model), project.validation);
  const bytes = Buffer.byteLength(JSON.stringify(fit.model));
  if (validation.exactAccuracy < config.minAccuracy || bytes > config.maxBytes) {
    throw new Error(
      `Sequence model failed validation/size requirements (${validation.exactAccuracy}, ${bytes} bytes). ${JSON.stringify(validation.failures.slice(0, 10))}`,
    );
  }
  const challenges = config.challenges
    ? z
        .array(z.strictObject({ input: z.string(), output: z.null() }))
        .min(1)
        .parse(JSON.parse(await readFile(resolve(root, config.challenges), "utf8")))
    : null;
  const report = {
    formatVersion: 2,
    architecture: fit.model.architecture,
    encoding: { tokenizer: fit.model.tokenizer, casing: fit.model.casing },
    contextRadius: fit.model.radius,
    backend: "Burn native CPU",
    seed: 42,
    artifactSha256: hash(JSON.stringify(fit.model)),
    bytes,
    parameters: fit.parameters,
    datasetSha256: project.sources.map((source) => ({
      source: source.source,
      sha256: hash(source.text),
    })),
    examples: {
      train: project.train.length,
      rejections: recipe.rejections?.length ?? 0,
      validation: project.validation.length,
      eval: project.evaluation.length,
    },
    supervisionSha256: hash(
      JSON.stringify(
        training.map((row) => ({
          ...row,
          labels: recipe.annotate(row, tokenize(row.input, recipe.tokenizer, recipe.casing)),
        })),
      ),
    ),
    supervisedTokens: fit.supervisedTokens,
    loss: fit.history,
    exportParity: fit.parity,
    validation,
    evaluation: await evaluateSequence(parser(fit.model), project.evaluation),
    challenges: challenges ? await evaluateSequence(parser(fit.model), challenges) : null,
    trainingMs: performance.now() - started,
    notes:
      "Float32 weights in a Burn binary record, base64-encoded in the artifact. Validation gates export. Eval labels do not influence selection. Scores are uncalibrated.",
  };
  await packageModel(project.output, fit.model, report);
  return { report, output: project.output };
}
