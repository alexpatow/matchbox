import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";
export default defineParser({
  input: z.string().min(1).max(128),
  output: z.strictObject({ even: z.boolean() }),
});
