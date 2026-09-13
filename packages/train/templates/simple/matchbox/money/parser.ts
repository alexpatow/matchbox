import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";
export default defineParser({
  input: z.string().min(1).max(256),
  output: z.strictObject({
    amount: z.number().nonnegative(),
    currency: z.enum(["USD", "EUR", "GBP", "SEK"]),
    approximate: z.boolean().default(false),
  }),
});
