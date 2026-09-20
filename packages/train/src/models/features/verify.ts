import { predictNativeRecord } from "../../native/record.js";
import type { FeatureArtifact } from "@matchbox-ai/core/internal";
import { featurePredictor } from "@matchbox-ai/core/internal";
export async function verifyFeatures(
  model: FeatureArtifact,
  weights: Uint8Array,
  rows: number[][],
) {
  const config = {
    vocabularySize: model.inputSize,
    fields: model.fields.map((field) => field.values.length),
  };
  const native = predictNativeRecord(config, weights, rows.flat());
  const predictor = await featurePredictor(model);
  let maxConfidenceError = 0;
  let labelDisagreements = 0;
  let acceptanceDisagreements = 0;
  const width = config.fields.reduce((sum, value) => sum + value, 0);
  try {
    rows.forEach((row, index) => {
      const result = predictor.predict(row);
      const expected = native.slice(index * width, (index + 1) * width);
      let offset = 0;
      let nativeConfidence = 1;
      for (const field of model.fields) {
        const a = expected.slice(offset, offset + field.values.length);
        const b = result.probabilities.slice(offset, offset + field.values.length);
        const best = Math.max(...a);
        nativeConfidence = Math.min(nativeConfidence, best);
        if (a.indexOf(best) !== b.indexOf(Math.max(...b))) {
          labelDisagreements++;
        }
        offset += field.values.length;
      }
      if (nativeConfidence >= model.threshold !== result.confidence >= model.threshold) {
        acceptanceDisagreements++;
      }
      expected.forEach((value, i) => {
        maxConfidenceError = Math.max(
          maxConfidenceError,
          Math.abs(value - result.probabilities[i]!),
        );
      });
    });
  } finally {
    predictor.dispose();
  }
  if (maxConfidenceError > 1e-4 || labelDisagreements || acceptanceDisagreements) {
    throw new Error("Numeric model native/WASM export parity failed.");
  }
  return { examples: rows.length, maxConfidenceError, labelDisagreements, acceptanceDisagreements };
}
