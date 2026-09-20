import { z } from "zod";
const schema = z.strictObject({
  formatVersion: z.literal(1),
  engine: z.literal("burn-0.21"),
  kind: z.literal("feature-parser"),
  architecture: z.literal("numeric-mlp"),
  taskModule: z.string(),
  encoderModule: z.string().min(1),
  decoderModule: z.null(),
  taskMetadata: z.unknown(),
  inputSize: z.number().int().min(1).max(10000),
  fields: z
    .array(
      z.strictObject({
        name: z
          .string()
          .min(1)
          .refine((name) => name !== "__proto__"),
        values: z
          .array(z.union([z.string(), z.number(), z.boolean(), z.null()]))
          .min(1)
          .max(256),
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
export type FeatureArtifact = z.infer<typeof schema>;
export function readFeatureArtifact(value: unknown): FeatureArtifact {
  const model = schema.parse(value, { jitless: true });
  if (
    new Set(model.fields.map((field) => field.name)).size !== model.fields.length ||
    model.fields.some(
      (field) =>
        new Set(field.values.map((item) => JSON.stringify(item))).size !== field.values.length,
    )
  ) {
    throw new Error("Duplicate feature classifier fields or values.");
  }
  return model;
}
