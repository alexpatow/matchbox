import type { RecordArtifact } from "./artifact.js";
import { recordFeatures } from "./features.js";
export function recordPredictor(model: RecordArtifact) {
  const [hidden, bias, output, outputBias] = model.weights.map((weight) =>
    Float32Array.from(weight.values, (value) => value * weight.scale),
  ) as [Float32Array, Float32Array, Float32Array, Float32Array];
  return (input: string) => {
    const activation = Array.from(bias);
    recordFeatures(input, model.vocabulary).forEach((value, feature) => {
      if (value)
        for (let unit = 0; unit < bias.length; unit++)
          activation[unit]! += hidden[feature * bias.length + unit]!;
    });
    const scores = Array.from(outputBias);
    activation.forEach((value, unit) => {
      for (let label = 0; label < scores.length; label++)
        scores[label]! += Math.tanh(value) * output[unit * scores.length + label]!;
    });
    let offset = 0;
    const fields = model.fields.map((field) => {
      const logits = scores.slice(offset, offset + field.values.length);
      offset += field.values.length;
      const max = Math.max(...logits);
      const probabilities = logits.map((value) => Math.exp(value - max));
      const total = probabilities.reduce((a, b) => a + b, 0);
      const index = logits.indexOf(max);
      return {
        field: field.name,
        value: field.values[index],
        confidence: probabilities[index]! / total,
      };
    });
    return {
      value: Object.fromEntries(fields.map((field) => [field.field, field.value])),
      confidence: Math.min(...fields.map((field) => field.confidence)),
      fields,
    };
  };
}
