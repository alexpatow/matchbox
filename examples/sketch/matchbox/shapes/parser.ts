import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";
export const pointSchema = z.strictObject({
  x: z.number().min(-1e6).max(1e6),
  y: z.number().min(-1e6).max(1e6),
});
export const strokeSchema = z.strictObject({ points: z.array(pointSchema).min(2).max(4096) });
export type Point = z.infer<typeof pointSchema>;
export type Stroke = z.infer<typeof strokeSchema>;
export default defineParser({
  input: strokeSchema,
  output: z.strictObject({ kind: z.enum(["ellipse", "rectangle", "triangle", "line", "unknown"]) }),
});
