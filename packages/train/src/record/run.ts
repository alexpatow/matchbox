import { createHash } from "node:crypto";
import { dirname, relative } from "node:path";
import { createRecordParser } from "@matchbox-ai/core/runtime";
import type { RecordArtifact } from "@matchbox-ai/core/runtime";
import type { loadProject } from "../load-project.js";
import { packageModel } from "../package-model.js";
import { evaluateSequence } from "../sequence/evaluate-sequence.js";
import { fitRecord } from "./fit.js";
export async function runRecord(
  project: Awaited<ReturnType<typeof loadProject>>,
  progress?: (epoch: number, loss: number) => void,
) {
  const start = performance.now();
  const taskModule = relative(dirname(project.output), project.taskPath).replaceAll("\\", "/");
  const fit = await fitRecord(
    project.train,
    {
      taskModule: taskModule.startsWith(".") ? taskModule : `./${taskModule}`,
      taskMetadata: project.task.toJSON(),
    },
    project.validation.map((row) => row.input),
    progress,
  );
  const evaluate = (artifact: RecordArtifact, rows = project.evaluation) =>
    evaluateSequence(
      createRecordParser(artifact, project.task),
      rows,
      (value) => project.task.validateOutput(value).success,
    );
  const validation = await evaluate(fit.quantized, project.validation);
  const bytes = Buffer.byteLength(JSON.stringify(fit.quantized));
  if (validation.exactAccuracy < project.config.minAccuracy || bytes > project.config.maxBytes)
    throw new Error(
      `Record model failed validation/size requirements (${validation.exactAccuracy}, ${bytes} bytes). ${JSON.stringify(validation.failures.slice(0, 10))}`,
    );
  const report = {
    formatVersion: 1,
    architecture: fit.quantized.architecture,
    backend: "TensorFlow native CPU",
    seed: 42,
    artifactSha256: createHash("sha256").update(JSON.stringify(fit.quantized)).digest("hex"),
    bytes,
    parameters: fit.quantized.weights.reduce((sum, weight) => sum + weight.values.length, 0),
    datasetSha256: project.sources.map((source) => ({
      source: source.source,
      sha256: createHash("sha256").update(source.text).digest("hex"),
    })),
    examples: {
      train: project.train.length,
      validation: project.validation.length,
      eval: project.evaluation.length,
    },
    loss: fit.history,
    exportParity: fit.parity,
    validation,
    quantized: await evaluate(fit.quantized),
    float: await evaluate(fit.float),
    untrained: await evaluate(fit.untrained),
    untrainedUngated: await evaluate({ ...fit.untrained, threshold: 0 }),
    baseline: project.baseline
      ? await evaluateSequence(
          project.baseline,
          project.evaluation,
          (value) => project.task.validateOutput(value).success,
        )
      : null,
    trainingMs: performance.now() - start,
    notes:
      "Each field classifies values present in training data. Vocabulary and value domains are fitted only on training. There are no number dictionaries, aliases, normalization rules, or span annotations. Unknown tokens abstain. Bag-of-words ignores order. Confidence is uncalibrated. This model cannot emit unseen numeric values.",
  };
  await packageModel(project.output, fit.quantized, report);
  return { report, output: project.output };
}
