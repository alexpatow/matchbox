import { defineParser, type InferOutput } from "@matchbox-ai/core";
import { z } from "zod";

const task = defineParser({
  input: z.string(),
  output: z.strictObject({
    country: z.enum(["SE", "DE"]),
    minimum: z.number(),
    owner: z.string().optional(),
  }),
});

type Output = InferOutput<typeof task>;
const accepted: Output = { country: "SE", minimum: 10 };
// @ts-expect-error Enum values remain narrow.
const wrongCountry: Output = { country: "US", minimum: 10 };
// @ts-expect-error Required properties remain required.
const missing: Output = { country: "SE" };
// @ts-expect-error Output values retain their schema types.
const wrongNumber: Output = { country: "SE", minimum: "10" };
const result = task.validateOutput(accepted);
if (result.success) {
  const country: "SE" | "DE" = result.data.country;
  const minimum: number = result.data.minimum;
  void [country, minimum];
} else {
  const message: string | undefined = result.issues[0]?.message;
  void message;
}
void [wrongCountry, missing, wrongNumber];

// @ts-expect-error Parser inputs must be strings.
defineParser({ input: z.number(), output: z.strictObject({}) });
