import { z } from "zod";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createParser } from "@matchbox-ai/core/runtime";
import { readRecurrentArtifact } from "@matchbox-ai/core/internal";
import type { RecurrentArtifact } from "@matchbox-ai/core/internal";
import type { SequenceDecoder } from "@matchbox-ai/core/runtime";
import type { DatasetExample } from "@matchbox-ai/core";
import type { textProject } from "../../text-project.js";
import { evaluateSequence } from "../../evaluation/evaluate-sequence.js";
import { packageModel } from "../../packaging/package-model.js";
import { readRecipe } from "./prepare.js";
import { fit } from "./fit.js";
import { diagnostics } from "./diagnostics.js";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export async function runRecurrent(
  command: "train" | "eval",
  project: ReturnType<typeof textProject>,
  progress?: (epoch: number, loss: number) => void,
) {
  const { task, config, root } = project;
  const sequence = config.sequence;
  if (!sequence?.recurrent) {
    throw new Error("A recurrent pipeline is required.");
  }
  const saved =
    command === "eval"
      ? readRecurrentArtifact(JSON.parse(await readFile(project.output, "utf8")))
      : null;
  const decoderPath = saved
    ? resolve(dirname(project.output), saved.decoderModule)
    : resolve(root, sequence.decoder);
  const decode: SequenceDecoder = (await import(pathToFileURL(decoderPath).href)).default;
  const evaluate = async (
    model: RecurrentArtifact,
    examples: readonly DatasetExample<unknown>[],
  ) => {
    const parser = createParser(model, task, decode);
    try {
      return await evaluateSequence(
        parser,
        examples,
        (value) => task.validateOutput(value).success,
      );
    } finally {
      parser.dispose();
    }
  };
  if (saved) {
    return { evaluation: await evaluate(saved, project.evaluation) };
  }
  const challenges = config.challenges
    ? z
        .array(z.strictObject({ input: z.string(), output: z.null() }))
        .min(1)
        .parse(JSON.parse(await readFile(resolve(root, config.challenges), "utf8")))
    : null;
  const recipe = readRecipe(
    (await import(pathToFileURL(resolve(root, sequence.recipe)).href)).default,
  );
  const modulePath = (path: string) => {
    const value = relative(dirname(project.output), path).replaceAll("\\", "/");
    return value.startsWith(".") ? value : `./${value}`;
  };
  const result = await fit(
    project.train,
    project.validation,
    recipe,
    sequence.recurrent,
    {
      taskMetadata: task.toJSON(),
      taskModule: modulePath(project.taskPath),
      decoderModule: modulePath(decoderPath),
    },
    progress,
  );
  const validation = await evaluate(result.model, project.validation);
  const bytes = Buffer.byteLength(JSON.stringify(result.model));
  if (validation.exactAccuracy < config.minAccuracy || bytes > config.maxBytes) {
    throw new Error(
      `Recurrent model failed validation/size requirements (${validation.exactAccuracy}, ${bytes} bytes).`,
    );
  }
  const report = {
    formatVersion: 2,
    architecture: result.model.architecture,
    backend: "Burn native CPU",
    seed: 42,
    encoding: {
      tokenizer: recipe.tokenizer,
      features: recipe.features,
      supervision: recipe.annotate,
    },
    artifactSha256: hash(JSON.stringify(result.model)),
    bytes,
    parameters: result.parameters,
    datasetSha256: project.sources.map((source) => ({
      source: source.source,
      sha256: hash(source.text),
    })),
    examples: {
      train: project.train.length,
      validation: project.validation.length,
      eval: project.evaluation.length,
    },
    parts: result.parts,
    supervisionSha256: result.supervisionSha256,
    loss: result.loss,
    validationLabelAccuracy: result.validationAccuracy,
    selectedEpoch: result.selectedEpoch,
    exportParity: result.parity,
    validation,
    evaluation: await evaluate(result.model, project.evaluation),
    challenges: challenges ? await evaluate(result.model, challenges) : null,
    diagnostics: {
      validation: await diagnostics(result.model, project.validation, recipe),
      evaluation: await diagnostics(result.model, project.evaluation, recipe),
    },
    optimizerMs: result.optimizerMs,
    trainingMs: result.trainingMs,
    notes:
      "Checkpoint selection uses validation label agreement. Export gates use complete parser accuracy and artifact size. Diagnostic code-point agreement is not parser acceptance. Confidence is uncalibrated.",
  };
  await packageModel(project.output, result.model, report);
  return { report, output: project.output };
}
