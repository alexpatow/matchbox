import { z } from "zod";
const schema = z.strictObject({
  formatVersion: z.literal(3),
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
  radius: z.literal(1),
  unknownTokens: z.enum(["abstain", "predict"]),
  threshold: z.number().min(0).max(1),
  precision: z.literal("float32"),
  weights: z
    .string()
    .min(4)
    .max(2_000_000)
    .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
});
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
