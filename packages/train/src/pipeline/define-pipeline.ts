import { z } from "zod";
export const pipelineSchema = z
  .strictObject({
    input: z.strictObject({ kind: z.literal("words") }).optional(),
    prediction: z.discriminatedUnion("kind", [
      z.strictObject({ kind: z.literal("field-classifier") }),
      z.strictObject({
        kind: z.literal("token-classifier"),
        recipe: z.string().min(1),
        decode: z.string().min(1),
      }),
    ]),
    acceptance: z
      .strictObject({
        minAccuracy: z.number().min(0).max(1).optional(),
        maxBytes: z.number().positive().optional(),
      })
      .optional(),
  })
  .superRefine((value, context) => {
    if (value.prediction.kind === "field-classifier" && !value.input)
      context.addIssue({
        code: "custom",
        message: "fieldClassifier requires an explicit input encoder.",
        path: ["input"],
      });
    if (value.prediction.kind === "token-classifier" && value.input)
      context.addIssue({
        code: "custom",
        message: "The sequence recipe owns tokenization; omit the duplicate input encoder.",
        path: ["input"],
      });
  });
export type Pipeline = z.infer<typeof pipelineSchema>;
export function definePipeline(pipeline: Pipeline): Pipeline {
  return pipelineSchema.parse(pipeline);
}
