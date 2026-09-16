import { z } from "zod";
export const textPartsSchema = z.strictObject({
  kind: z.literal("text-parts"),
  version: z.literal(1),
});
export const textFeaturesSchema = z.strictObject({
  kind: z.literal("text-features"),
  version: z.literal(1),
});
const schema = z.strictObject({
  formatVersion: z.literal(5),
  engine: z.literal("burn-0.21"),
  kind: z.literal("recurrent-parser"),
  architecture: z.literal("bidirectional-affine"),
  taskModule: z.string(),
  decoderModule: z.string(),
  taskMetadata: z.unknown(),
  tokenizer: textPartsSchema,
  features: textFeaturesSchema,
  labels: z.array(z.string().min(1)).min(2).max(64),
  supervision: z.enum(["all", "non-whitespace"]),
  threshold: z.number().min(0).max(1),
  maxInputLength: z.number().int().min(1).max(1_000_000),
  maxParts: z.number().int().min(1).max(65536),
  precision: z.literal("float32"),
  weights: z
    .string()
    .min(4)
    .max(4_000_000)
    .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
});
export type RecurrentArtifact = z.infer<typeof schema>;
export function readRecurrentArtifact(value: unknown): RecurrentArtifact {
  const model = schema.parse(value, { jitless: true });
  if (new Set(model.labels).size !== model.labels.length) {
    throw new Error("Duplicate recurrent labels.");
  }
  return model;
}
