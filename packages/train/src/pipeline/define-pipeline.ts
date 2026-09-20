import { z } from "zod";
export const pipelineSchema = z.strictObject({
  prediction: z.discriminatedUnion("kind", [
    z.strictObject({
      kind: z.literal("feature-classifier"),
      encode: z.string().min(1).default("./encode"),
      threshold: z.number().min(0).max(1).default(0.75),
    }),
    z.strictObject({ kind: z.literal("field-classifier") }),
    z.strictObject({
      kind: z.literal("token-classifier"),
      recipe: z.string().min(1).default("./recipe"),
      contextRadius: z.number().int().min(1).max(16).optional(),
      decode: z.string().min(1).default("./decode"),
    }),
    z.strictObject({
      kind: z.literal("recurrent-token-classifier"),
      recipe: z.string().min(1).default("./recipe"),
      decode: z.string().min(1).default("./decode"),
      epochs: z.number().int().min(1).max(100).default(8),
      learningRate: z.number().positive().max(0.1).default(0.003),
      batchParts: z.number().int().min(128).max(16384).default(4096),
      maxInputLength: z.number().int().min(1).max(1_000_000).default(262144),
      maxParts: z.number().int().min(1).max(65536).default(65536),
    }),
  ]),
  acceptance: z
    .strictObject({
      minAccuracy: z.number().min(0).max(1).optional(),
      maxBytes: z.number().positive().optional(),
    })
    .optional(),
});
export type Pipeline = z.infer<typeof pipelineSchema>;
export function definePipeline(pipeline: z.input<typeof pipelineSchema>): Pipeline {
  return pipelineSchema.parse(pipeline);
}
