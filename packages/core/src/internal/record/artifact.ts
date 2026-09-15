import { z } from "zod";
const value = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const schema = z.strictObject({
  formatVersion: z.literal(3),
  engine: z.literal("burn-0.21"),
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
  precision: z.literal("float32"),
  weights: z
    .string()
    .min(4)
    .max(10_000_000)
    .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
});
export type RecordArtifact = z.infer<typeof schema>;
export function readRecordArtifact(input: unknown): RecordArtifact {
  const model = schema.parse(input, { jitless: true });
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
  return model;
}
