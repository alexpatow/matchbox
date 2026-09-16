import { z } from "zod";
const fields = z.strictObject({
  engine: z.literal("burn-0.21"),
  kind: z.literal("sequence-parser"),
  architecture: z.literal("embedding-window-mlp"),
  taskModule: z.string(),
  decoderModule: z.string(),
  taskMetadata: z.unknown(),
  readout: z.enum(["all", "last"]),
  tokenizer: z.enum(["characters", "words"]),
  vocabulary: z.array(z.string()).min(1).max(10000),
  labels: z.array(z.string()).min(2).max(64),
  unknownTokens: z.enum(["abstain", "predict"]),
  threshold: z.number().min(0).max(1),
  precision: z.literal("float32"),
  weights: z
    .string()
    .min(4)
    .max(2_000_000)
    .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
});
const schema = z.discriminatedUnion("formatVersion", [
  fields.extend({
    formatVersion: z.literal(3),
    radius: z.literal(1),
    casing: z.literal("lowercase").optional(),
  }),
  fields.extend({
    formatVersion: z.literal(4),
    radius: z.number().int().min(1).max(16),
    casing: z.enum(["lowercase", "preserve"]),
  }),
]);
export type SequenceArtifact = z.infer<typeof schema>;
export function readSequenceArtifact(value: unknown): SequenceArtifact {
  const model = schema.parse(value, { jitless: true });
  if (
    new Set(model.vocabulary).size !== model.vocabulary.length ||
    new Set(model.labels).size !== model.labels.length
  ) {
    throw new Error("Duplicate sequence vocabulary or labels.");
  }
  return model;
}
