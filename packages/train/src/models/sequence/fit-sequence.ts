import { prepareSupervision } from "./prepare-supervision.js";
import { createNetwork } from "./create-network.js";
import * as tf from "@tensorflow/tfjs-node";
import { tensorPredictor, tokenize, windows } from "@matchbox-ai/core/internal";
import type { SequenceArtifact } from "@matchbox-ai/core/internal";
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
  const { vocabulary, radius, dropout, inputs, labels } = prepareSupervision(
    examples,
    recipe,
    shuffleLabels,
  );
  const model = createNetwork(vocabulary.length, recipe.labels.length);
  const optimizer = tf.train.adam(0.005);
  model.compile({ optimizer, loss: "categoricalCrossentropy" });
  const x = tf.tensor2d(inputs, [inputs.length, 3], "int32");
  const y = tf.tidy(() => tf.oneHot(tf.tensor1d(labels, "int32"), recipe.labels.length));
  function exportModel(precision: "float32" | "int8"): SequenceArtifact {
    const weights = model.getWeights().map((tensor, index) => {
      const values = Array.from(tensor.dataSync());
      const scale = precision === "int8" ? Math.max(...values.map(Math.abs)) / 127 || 1 : 1;
      return {
        name: model.weights[index]!.originalName,
        shape: tensor.shape,
        scale,
        values: precision === "int8" ? values.map((value) => Math.round(value / scale)) : values,
      };
    }) as SequenceArtifact["weights"];
    return {
      formatVersion: 2,
      kind: "sequence-parser",
      architecture: "embedding-window-mlp",
      ...metadata,
      modelTopology: JSON.parse(model.toJSON() as string),
      tokenizer: recipe.tokenizer,
      readout: recipe.readout,
      vocabulary,
      labels: [...recipe.labels],
      radius,
      unknownTokens: dropout > 0 ? "predict" : "abstain",
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
    let maxConfidenceError = 0;
    let labelDisagreements = 0;
    const checkedInputs = [...examples.slice(0, 16).map((row) => row.input), ...probes];
    const nativeProbabilities = checkedInputs.map((inputText) =>
      tf.tidy(() => {
        const tokens = tokenize(inputText, recipe.tokenizer);
        const input = tf.tensor2d(windows(tokens, vocabulary, radius), [tokens.length, 3], "int32");
        return (model.predict(input) as tf.Tensor).arraySync() as number[][];
      }),
    );
    const portable = await tensorPredictor(float);
    try {
      checkedInputs.forEach((inputText, probeIndex) => {
        portable.sequence(inputText).forEach((token, index) => {
          const scores = nativeProbabilities[probeIndex]![index]!;
          const maximum = Math.max(...scores);
          maxConfidenceError = Math.max(maxConfidenceError, Math.abs(maximum - token.confidence));
          if (recipe.labels[scores.indexOf(maximum)] !== token.label) labelDisagreements++;
        });
      });
    } finally {
      portable.dispose();
      await tf.setBackend("tensorflow");
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
