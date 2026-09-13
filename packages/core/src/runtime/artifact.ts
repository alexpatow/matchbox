import { z } from "zod";
const predicate = z.strictObject({
  field: z.string(),
  operator: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});
const schema = z.strictObject({
  formatVersion: z.literal(1),
  kind: z.literal("clause-parser"),
  algorithm: z.enum(["linear", "centroid"]),
  taskModule: z.string(),
  taskMetadata: z.unknown(),
  vocabulary: z.array(z.string()).min(1).max(10000),
  fieldTokens: z.record(z.string(), z.array(z.string())),
  templates: z
    .array(z.strictObject({ predicate, numberSlot: z.boolean() }))
    .min(2)
    .max(256),
  weights: z.array(z.array(z.number().int().min(-127).max(127))),
  scale: z.number().positive(),
  threshold: z.number().min(0).max(1),
});
export type ModelArtifact = z.infer<typeof schema>;
export function readArtifact(value: unknown): ModelArtifact {
  const model = schema.parse(value, { jitless: true });
  if (
    model.weights.length !== model.templates.length ||
    model.weights.some((row) => row.length !== model.vocabulary.length)
  )
    throw new Error("Invalid Matchbox weight dimensions.");
  if (new Set(model.vocabulary).size !== model.vocabulary.length)
    throw new Error("Duplicate model features.");
  return model;
}
