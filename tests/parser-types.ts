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

const objectTask = defineParser({
  input: z.strictObject({ points: z.array(z.strictObject({ x: z.number(), y: z.number() })) }),
  output: z.strictObject({ kind: z.enum(["ellipse", "rectangle"]) }),
});
const points: import("@matchbox-ai/core").InferInput<typeof objectTask> = {
  points: [{ x: 1, y: 2 }],
};
const wrongPoint: import("@matchbox-ai/core").InferInput<typeof objectTask> = {
  // @ts-expect-error Coordinates remain numbers.
  points: [{ x: "1", y: 2 }],
};
void [points, wrongPoint];
