import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";
// Replace this contract with your application's output schema.
export default defineParser({
  output: z.strictObject({ label: z.enum(["yes", "no"]) }),
});
