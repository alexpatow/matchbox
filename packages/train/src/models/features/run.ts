import { createHash } from "node:crypto";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { NumericEncoder } from "@matchbox-ai/core";
import { encodeFeatures, readFeatureArtifact } from "@matchbox-ai/core/internal";
import { createParser } from "@matchbox-ai/core/runtime";
import { fitNativeRecord } from "../../native/index.js";
import { evaluateSequence } from "../../evaluation/evaluate-sequence.js";
import { packageModel } from "../../packaging/package-model.js";
import type { loadProject } from "../../load-project.js";
import { outputFields } from "./fields.js";
import { verifyFeatures } from "./verify.js";
export async function runFeatures(
  project: Awaited<ReturnType<typeof loadProject>>,
  progress?: (epoch: number, loss: number) => void,
) {
  const start = performance.now();
  const options = project.config.features!;
  const encoderPath = resolve(project.root, options.encoder);
  const encoder: NumericEncoder<unknown> = (await import(pathToFileURL(encoderPath).href)).default;
  const fields = outputFields(project.train, project.task.toJSON());
  const config = {
    vocabularySize: encoder.size,
    fields: fields.map((field) => field.values.length),
  };
  const inputs = project.train.map((row) => encodeFeatures(encoder, row.input));
  const labels = project.train.flatMap((row) =>
    fields.map((field) =>
      field.values.indexOf(
        (row.output as Record<string, string | number | boolean | null>)[field.name]!,
      ),
    ),
  );
  const result = await fitNativeRecord(config, inputs, labels, progress);
  const modulePath = (path: string) => {
    const value = relative(dirname(project.output), path).replaceAll("\\", "/");
    return value.startsWith(".") ? value : `./${value}`;
  };
  const model = readFeatureArtifact({
    formatVersion: 1,
    engine: "burn-0.21",
    kind: "feature-parser",
    architecture: "numeric-mlp",
    taskModule: modulePath(project.taskPath),
    encoderModule: modulePath(encoderPath),
    decoderModule: null,
    taskMetadata: project.task.toJSON(),
    inputSize: encoder.size,
    fields,
    threshold: options.threshold,
    precision: "float32",
    weights: Buffer.from(result.weights).toString("base64"),
  });
  const parity = await verifyFeatures(
    model,
    result.weights,
    project.validation.map((row) => encodeFeatures(encoder, row.input)),
  );
  const parser = createParser(model, project.task, encoder);
  try {
    const validate = (value: unknown) => project.task.validateOutput(value).success;
    const validation = await evaluateSequence(parser, project.validation, validate);
    const bytes = Buffer.byteLength(JSON.stringify(model));
    if (validation.exactAccuracy < project.config.minAccuracy || bytes > project.config.maxBytes) {
      throw new Error(
        `Feature model failed validation/size requirements (${validation.exactAccuracy}, ${bytes} bytes).`,
      );
    }
    const report = {
      formatVersion: 2,
      architecture: model.architecture,
      backend: "Burn native CPU",
      seed: 42,
      artifactSha256: createHash("sha256").update(JSON.stringify(model)).digest("hex"),
      bytes,
      parameters: result.parameters,
      datasetSha256: project.sources.map((source) => ({
        source: source.source,
        sha256: createHash("sha256").update(source.text).digest("hex"),
      })),
      examples: {
        train: project.train.length,
        validation: project.validation.length,
        eval: project.evaluation.length,
      },
      loss: result.loss,
      exportParity: parity,
      validation,
      evaluation: await evaluateSequence(parser, project.evaluation, validate),
      trainingMs: performance.now() - start,
      notes:
        "Application-owned fixed numeric features. Field values are finite classes fitted on training only. Confidence is uncalibrated. The encoder must remain deterministic and unchanged until retraining.",
    };
    await packageModel(project.output, model, report);
    return { report, output: project.output };
  } finally {
    parser.dispose();
  }
}
