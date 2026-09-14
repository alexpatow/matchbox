import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";
export default defineParser({
  input: z.string().min(1).max(160),
  output: z.union([
    z.strictObject({ kind: z.literal("duration"), seconds: z.number().nonnegative().max(604800) }),
    z.strictObject({ kind: z.literal("relative"), seconds: z.number().nonnegative().max(604800) }),
    z.strictObject({
      kind: z.literal("datetime"),
      dayOffset: z.number().int().min(0).max(1),
      hour: z.number().int().min(0).max(23),
      minute: z.number().int().min(0).max(59),
    }),
  ]),
});
