import { createNetwork } from "./create-network.js";
import * as tf from "@tensorflow/tfjs-node";
import { sequencePredictor, tokenize, windows } from "@matchbox-ai/core/runtime";
import type { SequenceArtifact } from "@matchbox-ai/core/runtime";
import type { DatasetExample } from "@matchbox-ai/core";
import type { SequenceRecipe } from "./types.js";
export async function fitSequence(
  examples: readonly DatasetExample<unknown>[],
  recipe: SequenceRecipe,
  metadata: Pick<SequenceArtifact, "taskModule" | "taskMetadata" | "decoderModule">,
  probes: readonly string[] = [],
  shuffleLabels = false,
  progress?: (epoch: number, loss: number) => void,
) {
  await tf.setBackend("tensorflow");
  await tf.ready();
  const vocabulary = [
    ...new Set(
      examples.flatMap((row) => tokenize(row.input, recipe.tokenizer).map((token) => token.key)),
    ),
  ].sort();
  const radius = 1;
  const inputs: number[][] = [];
  const labels: number[] = [];
  for (const example of examples) {
    const tokens = tokenize(example.input, recipe.tokenizer);
    const annotations = recipe.annotate(example, tokens);
    if (annotations.length !== tokens.length)
      throw new Error(`Annotation length mismatch: ${example.input}`);
    windows(tokens, vocabulary, radius).forEach((window, position) => {
      const label = annotations[position];
      if (label === null) return;
      const id = recipe.labels.indexOf(label!);
      if (id < 0) throw new Error(`Unknown annotation ${label}: ${example.input}`);
      inputs.push(window);
      labels.push(id);
    });
  }
  if (recipe.labels.some((_, id) => !labels.includes(id)))
    throw new Error("Every label needs supervised training examples.");
  if (shuffleLabels) {
    let state = 173;
    for (let index = labels.length - 1; index > 0; index--) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const other = state % (index + 1);
      [labels[index], labels[other]] = [labels[other]!, labels[index]!];
    }
  }
  const model = createNetwork(vocabulary.length, recipe.labels.length);
  const optimizer = tf.train.adam(0.02);
  model.compile({ optimizer, loss: "categoricalCrossentropy" });
  const x = tf.tensor2d(inputs, [inputs.length, 3], "int32");
  const y = tf.tidy(() => tf.oneHot(tf.tensor1d(labels, "int32"), recipe.labels.length));
  function exportModel(precision: "float32" | "int8"): SequenceArtifact {
    const weights = model.getWeights().map((tensor) => {
      const values = Array.from(tensor.dataSync());
      const scale = precision === "int8" ? Math.max(...values.map(Math.abs)) / 127 || 1 : 1;
      return {
        shape: tensor.shape,
        scale,
        values: precision === "int8" ? values.map((value) => Math.round(value / scale)) : values,
      };
    }) as SequenceArtifact["weights"];
    return {
      formatVersion: 1,
      kind: "sequence-parser",
      architecture: "embedding-window-mlp",
      ...metadata,
      tokenizer: recipe.tokenizer,
      readout: recipe.readout,
      vocabulary,
      labels: [...recipe.labels],
      radius,
      threshold: 0.75,
      precision,
      weights,
    };
  }
  const untrained = exportModel("float32");
  const history: number[] = [];
  try {
    await model.fit(x, y, {
      epochs: 55,
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
    const float = exportModel("float32");
    const quantized = exportModel("int8");
    // Compare the independent portable implementation against TensorFlow before disposal.
    const portable = sequencePredictor(float);
    let maxConfidenceError = 0;
    let labelDisagreements = 0;
    const checkedInputs = [...examples.slice(0, 16).map((row) => row.input), ...probes];
    for (const inputText of checkedInputs) {
      const tokens = tokenize(inputText, recipe.tokenizer);
      const probabilities = tf.tidy(() => {
        const input = tf.tensor2d(windows(tokens, vocabulary, radius), [tokens.length, 3], "int32");
        return (model.predict(input) as tf.Tensor).arraySync() as number[][];
      });
      portable(inputText).forEach((token, index) => {
        const scores = probabilities[index]!;
        const maximum = Math.max(...scores);
        maxConfidenceError = Math.max(maxConfidenceError, Math.abs(maximum - token.confidence));
        if (recipe.labels[scores.indexOf(maximum)] !== token.label) labelDisagreements++;
      });
    }
    if (labelDisagreements || maxConfidenceError > 1e-5)
      throw new Error("Exported runtime disagrees with TensorFlow.js.");
    return {
      untrained,
      float,
      quantized,
      history,
      parity: { examples: checkedInputs.length, maxConfidenceError, labelDisagreements },
      supervisedTokens: inputs.length,
    };
  } finally {
    x.dispose();
    y.dispose();
    model.dispose();
    optimizer.dispose();
  }
}
