import { createHash } from "node:crypto";
import { featureCount, encodeParts, splitParts, tensorPredictor } from "@matchbox-ai/core/internal";
import type { RecurrentArtifact } from "@matchbox-ai/core/internal";
import type { DatasetExample } from "@matchbox-ai/core";
import { fitRecurrent, recurrentPredictor } from "../../native/recurrent.js";
import type { RecurrentOptions } from "../../native/recurrent.js";
import { sequenceParity } from "../sequence/export-parity.js";
import { prepareRecurrent } from "./prepare.js";
import type { RecurrentRecipe } from "./types.js";
export async function fit(
  train: readonly DatasetExample<unknown>[],
  validation: readonly DatasetExample<unknown>[],
  recipe: RecurrentRecipe,
  options: RecurrentOptions & { maxInputLength: number; maxParts: number },
  metadata: Pick<RecurrentArtifact, "taskModule" | "taskMetadata" | "decoderModule">,
  progress?: (epoch: number, loss: number) => void,
) {
  const started = performance.now();
  const training = prepareRecurrent(train, recipe, options);
  const heldOut = prepareRecurrent(validation, recipe, options);
  const hash = createHash("sha256");
  for (const array of [training.features, training.targets, training.offsets]) {
    hash.update(new Uint8Array(array.buffer, array.byteOffset, array.byteLength));
  }
  const config = { featureCount, labelCount: recipe.labels.length, maxParts: options.maxParts };
  const optimizerStarted = performance.now();
  const result = await fitRecurrent(
    config,
    {
      epochs: options.epochs,
      learningRate: options.learningRate,
      batchParts: options.batchParts,
    },
    training,
    heldOut,
    progress,
  );
  const optimizerMs = performance.now() - optimizerStarted;
  const model: RecurrentArtifact = {
    formatVersion: 5,
    engine: "burn-0.21",
    kind: "recurrent-parser",
    architecture: "bidirectional-affine",
    ...metadata,
    tokenizer: recipe.tokenizer,
    features: recipe.features,
    labels: [...recipe.labels],
    supervision: recipe.annotate.whitespace === "context" ? "non-whitespace" : "all",
    threshold: 0.75,
    maxInputLength: options.maxInputLength,
    maxParts: options.maxParts,
    precision: "float32",
    weights: Buffer.from(result.weights).toString("base64"),
  };
  const native = recurrentPredictor(config, result.weights);
  const portable = await tensorPredictor(model);
  const parity = sequenceParity(model.threshold);
  const probes = [...train.slice(0, 16), ...validation];
  try {
    for (const { input } of probes) {
      const scores = native.predict(encodeParts(splitParts(input)));
      portable.sequence(input).forEach((token, index) => {
        const row = scores.slice(index * recipe.labels.length, (index + 1) * recipe.labels.length);
        const confidence = Math.max(...row);
        parity.add({ label: recipe.labels[row.indexOf(confidence)]!, confidence }, token);
      });
    }
  } finally {
    portable.dispose();
  }
  return {
    model,
    parameters: result.parameters,
    loss: result.loss,
    validationAccuracy: result.validationAccuracy,
    selectedEpoch: result.selectedEpoch,
    optimizerMs,
    trainingMs: performance.now() - started,
    supervisionSha256: hash.digest("hex"),
    parts: { train: training.features.length / 16, validation: heldOut.features.length / 16 },
    parity: { examples: probes.length, ...parity.report() },
  };
}
