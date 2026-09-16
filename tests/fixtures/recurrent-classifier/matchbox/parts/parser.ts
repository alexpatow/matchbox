import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";
export default defineParser({
  input: z.string(),
  output: z.array(
    z.strictObject({
      type: z.enum(["word", "separator"]),
      start: z.number().int().nonnegative(),
      end: z.number().int().positive(),
    }),
  ),
});
