import { z } from "zod";
const matrix = z.strictObject({
  name: z.string().min(1),
  shape: z.array(z.number().int().positive()).min(1).max(2),
  values: z.array(z.number()).max(1_000_000),
  scale: z.number().positive(),
});
const schema = z.strictObject({
  formatVersion: z.literal(2),
  modelTopology: z.record(z.string(), z.unknown()),
  kind: z.literal("sequence-parser"),
  architecture: z.literal("embedding-window-mlp"),
  taskModule: z.string(),
  decoderModule: z.string(),
  taskMetadata: z.unknown(),
  readout: z.enum(["all", "last"]),
  tokenizer: z.enum(["characters", "words"]),
  vocabulary: z.array(z.string()).min(1).max(10000),
  labels: z.array(z.string()).min(2).max(64),
  radius: z.number().int().min(0).max(4),
  unknownTokens: z.enum(["abstain", "predict"]).default("abstain"),
  threshold: z.number().min(0).max(1),
  precision: z.enum(["float32", "int8"]),
  weights: z.tuple([matrix, matrix, matrix, matrix, matrix]),
});
export type SequenceArtifact = z.infer<typeof schema>;
export function readSequenceArtifact(value: unknown): SequenceArtifact {
  const model = schema.parse(value, { jitless: true });
  const [embedding, , bias] = model.weights;
  const dimensions = [
    [model.vocabulary.length + 2, embedding.shape[1]],
    [(model.radius * 2 + 1) * embedding.shape[1]!, bias.shape[0]],
    [bias.shape[0]],
    [bias.shape[0], model.labels.length],
    [model.labels.length],
  ];
  model.weights.forEach((weight, i) => {
    if (
      JSON.stringify(weight.shape) !== JSON.stringify(dimensions[i]) ||
      weight.values.length !== weight.shape.reduce((a, b) => a * b, 1) ||
      (model.precision === "int8" &&
        weight.values.some((v) => !Number.isInteger(v) || Math.abs(v) > 127))
    ) {
      throw new Error("Invalid Matchbox sequence weights.");
    }
  });
  if (
    new Set(model.vocabulary).size !== model.vocabulary.length ||
    new Set(model.labels).size !== model.labels.length
  ) {
    throw new Error("Duplicate sequence vocabulary or labels.");
  }
  if (new Set(model.weights.map((weight) => weight.name)).size !== model.weights.length) {
    throw new Error("Duplicate TensorFlow weight names.");
  }
  return model;
}
