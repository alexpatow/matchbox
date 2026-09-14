import * as tf from "@tensorflow/tfjs-node";
import { recordFeatures, tensorPredictor } from "@matchbox-ai/core/internal";
import type { RecordArtifact } from "@matchbox-ai/core/internal";

export async function verifyExport(
  model: tf.LayersModel,
  artifact: RecordArtifact,
  probes: readonly string[],
) {
  // Snapshot predictions on the native backend before loading the browser model.
  const native = probes.map((input) =>
    tf.tidy(() => {
      const logits = model.predict(
        tf.tensor2d([recordFeatures(input, artifact.vocabulary)]),
      ) as tf.Tensor;
      let offset = 0;
      return artifact.fields.map((field) => {
        const probabilities = Array.from(
          tf.softmax(tf.slice(logits, [0, offset], [1, field.values.length])).dataSync(),
        );
        offset += field.values.length;
        return probabilities;
      });
    }),
  );
  const predictor = await tensorPredictor(artifact);
  let maxConfidenceError = 0;
  let labelDisagreements = 0;
  try {
    probes.forEach((input, probeIndex) => {
      predictor.record(input).fields.forEach((prediction, index) => {
        const scores = native[probeIndex]![index]!;
        const maximum = Math.max(...scores);
        maxConfidenceError = Math.max(
          maxConfidenceError,
          Math.abs(maximum - prediction.confidence),
        );
        if (prediction.value !== artifact.fields[index]!.values[scores.indexOf(maximum)]) {
          labelDisagreements++;
        }
      });
    });
  } finally {
    predictor.dispose();
    await tf.setBackend("tensorflow");
  }
  if (labelDisagreements || maxConfidenceError > 1e-5) {
    throw new Error("Serialized TensorFlow model disagrees with native predictions.");
  }
  return { examples: probes.length, labelDisagreements, maxConfidenceError };
}
