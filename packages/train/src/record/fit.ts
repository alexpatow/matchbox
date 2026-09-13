import * as tf from "@tensorflow/tfjs-node";
import {
  recordFeatures,
  recordTokens,
  recordPredictor,
  readRecordArtifact,
} from "@matchbox-ai/core/runtime";
import type { RecordArtifact } from "@matchbox-ai/core/runtime";
import type { DatasetExample, ParserMetadata } from "@matchbox-ai/core";
export async function fitRecord(
  examples: readonly DatasetExample<unknown>[],
  metadata: { taskModule: string; taskMetadata: ParserMetadata },
  probes: readonly string[],
  progress?: (epoch: number, loss: number) => void,
) {
  const schema = metadata.taskMetadata.output;
  if (schema.type !== "object" || !schema.properties || schema.additionalProperties !== false)
    throw new Error(
      "The default trainer currently supports strict flat objects with primitive field values. Use an explicit sequence pipeline for other shapes.",
    );
  const fields = Object.keys(schema.properties).map((name) => {
    const values = [
      ...new Map(
        examples.map((row) => {
          const value = (row.output as Record<string, unknown>)[name];
          if (value !== null && !["number", "string", "boolean"].includes(typeof value))
            throw new Error(`output.${name}: the default trainer requires primitive field values.`);
          return [JSON.stringify(value), value as string | number | boolean | null] as const;
        }),
      ).entries(),
    ]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);
    return { name, values };
  });
  const vocabulary = [...new Set(examples.flatMap((row) => recordTokens(row.input)))].sort();
  const outputs = fields.reduce((sum, field) => sum + field.values.length, 0);
  if (
    fields.length > 32 ||
    fields.some((field) => field.values.length > 256) ||
    vocabulary.length > 10000
  )
    throw new Error(
      "Default trainer capacity exceeded. Use a custom pipeline for larger output domains.",
    );
  await tf.setBackend("tensorflow");
  await tf.ready();
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [vocabulary.length],
        units: 32,
        activation: "tanh",
        kernelInitializer: tf.initializers.glorotUniform({ seed: 42 }),
      }),
      tf.layers.dense({
        units: outputs,
        kernelInitializer: tf.initializers.glorotUniform({ seed: 43 }),
      }),
    ],
  });
  const optimizer = tf.train.adam(0.02);
  model.compile({
    optimizer,
    loss: (gold, logits) =>
      tf.tidy(() => {
        let offset = 0;
        const losses = fields.map((field) => {
          const count = field.values.length;
          const target = tf.slice(gold, [0, offset], [-1, count]);
          const scores = tf.slice(logits, [0, offset], [-1, count]);
          offset += count;
          return tf.neg(tf.sum(tf.mul(target, tf.logSoftmax(scores)), 1));
        });
        return tf.mean(tf.addN(losses));
      }),
  });
  const x = tf.tensor2d(examples.map((row) => recordFeatures(row.input, vocabulary)));
  const y = tf.tensor2d(
    examples.map((row) =>
      fields.flatMap((field) =>
        field.values.map((value) =>
          value === (row.output as Record<string, unknown>)[field.name] ? 1 : 0,
        ),
      ),
    ),
  );
  function exported(precision: "int8" | "float32"): RecordArtifact {
    const weights = model.getWeights().map((tensor) => {
      const values = Array.from(tensor.dataSync());
      const scale =
        precision === "int8"
          ? values.reduce((max, value) => Math.max(max, Math.abs(value)), 0) / 127 || 1
          : 1;
      return {
        shape: tensor.shape,
        values: precision === "int8" ? values.map((value) => Math.round(value / scale)) : values,
        scale,
      };
    }) as RecordArtifact["weights"];
    return readRecordArtifact({
      formatVersion: 1,
      kind: "record-parser",
      architecture: "bag-of-words-mlp",
      ...metadata,
      decoderModule: null,
      fields,
      vocabulary,
      threshold: 0.75,
      precision,
      weights,
    });
  }
  const untrained = exported("float32");
  const history: number[] = [];
  try {
    await model.fit(x, y, {
      epochs: 100,
      batchSize: 128,
      shuffle: false,
      verbose: 0,
      callbacks: {
        onEpochEnd(epoch, logs) {
          history.push(Number(logs?.loss));
          progress?.(epoch + 1, Number(logs?.loss));
        },
      },
    });
    const float = exported("float32"),
      quantized = exported("int8");
    const predict = recordPredictor(float);
    let maxConfidenceError = 0,
      labelDisagreements = 0;
    for (const input of probes) {
      const logits = tf.tidy(() =>
        Array.from(
          (model.predict(tf.tensor2d([recordFeatures(input, vocabulary)])) as tf.Tensor).dataSync(),
        ),
      );
      let offset = 0;
      predict(input).fields.forEach((prediction, index) => {
        const field = fields[index]!;
        const scores = logits.slice(offset, offset + field.values.length);
        offset += field.values.length;
        const max = Math.max(...scores);
        const confidence = 1 / scores.reduce((sum, score) => sum + Math.exp(score - max), 0);
        maxConfidenceError = Math.max(
          maxConfidenceError,
          Math.abs(confidence - prediction.confidence),
        );
        if (prediction.value !== field.values[scores.indexOf(max)]) labelDisagreements++;
      });
    }
    if (labelDisagreements || maxConfidenceError > 1e-5)
      throw new Error("Exported record runtime disagrees with TensorFlow.");
    return {
      float,
      quantized,
      untrained,
      history,
      parity: { examples: probes.length, labelDisagreements, maxConfidenceError },
    };
  } finally {
    x.dispose();
    y.dispose();
    model.dispose();
    optimizer.dispose();
  }
}
