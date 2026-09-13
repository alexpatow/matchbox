import type { SequenceArtifact } from "./artifact.js";
import { tokenize, windows } from "./tokenize.js";
import type { TaggedToken } from "./types.js";
/** Prepare dequantized arrays once when the artifact is loaded. */
export function sequencePredictor(model: SequenceArtifact) {
  const [embedding, hidden, bias, output, outputBias] = model.weights.map((matrix) =>
    Float32Array.from(matrix.values, (value) => value * matrix.scale),
  ) as [Float32Array, Float32Array, Float32Array, Float32Array, Float32Array];
  const width = model.weights[0].shape[1]!;
  const units = bias.length;
  return (input: string): TaggedToken[] => {
    const tokens = tokenize(input, model.tokenizer);
    return windows(tokens, model.vocabulary, model.radius).map((ids, position) => {
      const activation = Array.from(bias);
      ids.forEach((id, slot) => {
        for (let feature = 0; feature < width; feature++)
          for (let unit = 0; unit < units; unit++)
            activation[unit]! +=
              embedding[id * width + feature]! * hidden[(slot * width + feature) * units + unit]!;
      });
      const scores = Array.from(outputBias);
      activation.forEach((value, unit) => {
        for (let label = 0; label < scores.length; label++)
          scores[label]! += Math.tanh(value) * output[unit * scores.length + label]!;
      });
      const maximum = Math.max(...scores);
      const exp = scores.map((score) => Math.exp(score - maximum));
      const label = scores.indexOf(maximum);
      return {
        ...tokens[position]!,
        label: model.labels[label]!,
        confidence: exp[label]! / exp.reduce((a, b) => a + b, 0),
      };
    });
  };
}
