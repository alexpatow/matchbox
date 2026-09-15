import { predictNativeRecord } from "../../native/index.js";
import { recordFeatures, tensorPredictor } from "@matchbox-ai/core/internal";
import type { RecordArtifact } from "@matchbox-ai/core/internal";
export async function verifyExport(
  weights: Uint8Array,
  artifact: RecordArtifact,
  probes: readonly string[],
) {
  const config = {
    vocabularySize: artifact.vocabulary.length,
    fields: artifact.fields.map((field) => field.values.length),
  };
  const predictor = await tensorPredictor(artifact);
  let maxConfidenceError = 0;
  let labelDisagreements = 0;
  try {
    for (const input of probes) {
      const native = predictNativeRecord(
        config,
        weights,
        recordFeatures(input, artifact.vocabulary),
      );
      let offset = 0;
      predictor.record(input).fields.forEach((prediction, index) => {
        const field = artifact.fields[index]!;
        const scores = native.slice(offset, offset + field.values.length);
        offset += field.values.length;
        const maximum = Math.max(...scores);
        maxConfidenceError = Math.max(
          maxConfidenceError,
          Math.abs(maximum - prediction.confidence),
        );
        if (prediction.value !== field.values[scores.indexOf(maximum)]) {
          labelDisagreements++;
        }
      });
    }
  } finally {
    predictor.dispose();
  }
  if (labelDisagreements || maxConfidenceError > 1e-5) {
    throw new Error("Burn native and WASM record predictions disagree.");
  }
  return { examples: probes.length, labelDisagreements, maxConfidenceError };
}
