import * as tf from "@tensorflow/tfjs-core";
import { loadLayersModel } from "@tensorflow/tfjs-layers";
import "@tensorflow/tfjs-backend-cpu";
import { recordFeatures } from "../../internal/record/index.js";
import type { RecordArtifact } from "../../internal/record/index.js";
import { tokenize, windows } from "../../internal/sequence/index.js";
import type { SequenceArtifact } from "../../internal/sequence/index.js";

export async function prepareCpu() {
  if (tf.getBackend() !== "cpu") {
    await tf.setBackend("cpu");
  }
  await tf.ready();
}
export async function tensorPredictor(artifact: RecordArtifact | SequenceArtifact) {
  await prepareCpu();
  const values = Float32Array.from(
    artifact.weights.flatMap((weight) => weight.values.map((value) => value * weight.scale)),
  );
  const model = await loadLayersModel(
    tf.io.fromMemory({
      modelTopology: artifact.modelTopology,
      weightSpecs: artifact.weights.map((weight) => ({
        name: weight.name,
        shape: weight.shape,
        dtype: "float32" as const,
      })),
      weightData: values.buffer,
    }),
  );
  const check = () => {
    if (tf.getBackend() !== "cpu") {
      throw new Error("The TensorFlow backend changed. Prepare CPU inference before predicting.");
    }
  };
  const record = (input: string) => {
    check();
    const probabilities = tf.tidy(() => {
      const logits = model.predict(
        tf.tensor2d([recordFeatures(input, artifact.vocabulary)]),
      ) as tf.Tensor;
      let offset = 0;
      return (artifact as RecordArtifact).fields.map((field) => {
        const scores = Array.from(
          tf.softmax(tf.slice(logits, [0, offset], [1, field.values.length])).dataSync(),
        );
        offset += field.values.length;
        return scores;
      });
    });
    const fields = (artifact as RecordArtifact).fields.map((field, index) => {
      const scores = probabilities[index]!;
      const confidence = Math.max(...scores);
      return { field: field.name, value: field.values[scores.indexOf(confidence)], confidence };
    });
    return {
      fields,
      value: Object.fromEntries(fields.map((field) => [field.field, field.value])),
      confidence: Math.min(...fields.map((field) => field.confidence)),
    };
  };
  const sequence = (input: string) => {
    check();
    const sequenceArtifact = artifact as SequenceArtifact;
    const tokens = tokenize(input, sequenceArtifact.tokenizer);
    if (!tokens.length) {
      return [];
    }
    return tf.tidy(() => {
      const ids = tf.tensor2d(
        windows(tokens, artifact.vocabulary, sequenceArtifact.radius),
        undefined,
        "int32",
      );
      const probabilities = (model.predict(ids) as tf.Tensor).arraySync() as number[][];
      return tokens.map((token, index) => {
        const scores = probabilities[index]!;
        const confidence = Math.max(...scores);
        return {
          ...token,
          label: sequenceArtifact.labels[scores.indexOf(confidence)]!,
          confidence,
        };
      });
    });
  };
  return { record, sequence, dispose: () => model.dispose() };
}
