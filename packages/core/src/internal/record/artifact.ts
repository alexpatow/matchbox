import { z } from "zod";
const value = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const matrix = z.strictObject({
  name: z.string().min(1),
  shape: z.array(z.number().int().positive()).min(1).max(2),
  values: z.array(z.number()).max(1000000),
  scale: z.number().positive(),
});
const schema = z.strictObject({
  formatVersion: z.literal(2),
  modelTopology: z.record(z.string(), z.unknown()),
  kind: z.literal("record-parser"),
  architecture: z.literal("bag-of-words-mlp"),
  taskModule: z.string(),
  decoderModule: z.null(),
  taskMetadata: z.unknown(),
  vocabulary: z.array(z.string()).min(1).max(10000),
  fields: z
    .array(
      z.strictObject({
        name: z
          .string()
          .min(1)
          .refine((name) => name !== "__proto__"),
        values: z.array(value).min(1).max(256),
      }),
    )
    .min(1)
    .max(32),
  threshold: z.number().min(0).max(1),
  precision: z.enum(["float32", "int8"]),
  weights: z.tuple([matrix, matrix, matrix, matrix]),
});
export type RecordArtifact = z.infer<typeof schema>;
export function readRecordArtifact(input: unknown): RecordArtifact {
  const model = schema.parse(input, { jitless: true });
  const units = model.weights[1].values.length;
  const outputs = model.fields.reduce((sum, field) => sum + field.values.length, 0);
  const shapes = [[model.vocabulary.length, units], [units], [units, outputs], [outputs]];
  model.weights.forEach((weight, index) => {
    if (
      JSON.stringify(weight.shape) !== JSON.stringify(shapes[index]) ||
      weight.values.length !== weight.shape.reduce((a, b) => a * b, 1) ||
      (model.precision === "int8" &&
        weight.values.some((value) => !Number.isInteger(value) || Math.abs(value) > 127))
    ) {
      throw new Error("Invalid Matchbox record weights.");
    }
  });
  if (
    new Set(model.vocabulary).size !== model.vocabulary.length ||
    new Set(model.fields.map((field) => field.name)).size !== model.fields.length ||
    model.fields.some(
      (field) =>
        new Set(field.values.map((value) => JSON.stringify(value))).size !== field.values.length,
    )
  ) {
    throw new Error("Duplicate record vocabulary, fields, or values.");
  }
  if (new Set(model.weights.map((weight) => weight.name)).size !== model.weights.length) {
    throw new Error("Duplicate TensorFlow weight names.");
  }
  return model;
}
