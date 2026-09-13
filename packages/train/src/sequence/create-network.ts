import * as tf from "@tensorflow/tfjs-node";
export function createNetwork(vocabularySize: number, labelCount: number) {
  return tf.sequential({
    layers: [
      tf.layers.embedding({
        inputDim: vocabularySize + 2,
        outputDim: 8,
        inputLength: 3,
        embeddingsInitializer: tf.initializers.randomUniform({
          minval: -0.1,
          maxval: 0.1,
          seed: 42,
        }),
      }),
      tf.layers.flatten(),
      tf.layers.dense({
        units: 16,
        activation: "tanh",
        kernelInitializer: tf.initializers.glorotUniform({ seed: 43 }),
      }),
      tf.layers.dense({
        units: labelCount,
        activation: "softmax",
        kernelInitializer: tf.initializers.glorotUniform({ seed: 44 }),
      }),
    ],
  });
}
