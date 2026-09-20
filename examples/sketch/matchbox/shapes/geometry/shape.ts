import { z } from "zod";
import { pointSchema } from "../parser";
export const shapeSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("line"), start: pointSchema, end: pointSchema }),
  z.strictObject({
    kind: z.literal("ellipse"),
    center: pointSchema,
    radiusX: z.number().positive(),
    radiusY: z.number().positive(),
    rotation: z.number(),
  }),
  z.strictObject({
    kind: z.literal("rectangle"),
    center: pointSchema,
    width: z.number().positive(),
    height: z.number().positive(),
    rotation: z.number(),
  }),
  z.strictObject({
    kind: z.literal("triangle"),
    vertices: z.tuple([pointSchema, pointSchema, pointSchema]),
  }),
]);
export type Shape = z.infer<typeof shapeSchema>;
