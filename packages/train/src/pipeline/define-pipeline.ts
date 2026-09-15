import { z } from "zod";
export const pipelineSchema = z.strictObject({
  prediction: z.discriminatedUnion("kind", [
    z.strictObject({ kind: z.literal("field-classifier") }),
    z.strictObject({
      kind: z.literal("token-classifier"),
      recipe: z.string().min(1).default("./recipe"),
      decode: z.string().min(1).default("./decode"),
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
export function definePipeline(pipeline: Pipeline): Pipeline {
  return pipelineSchema.parse(pipeline);
}
