import { z } from "zod";
import {
  splitParts,
  encodeParts,
  textPartsSchema,
  textFeaturesSchema,
} from "@matchbox-ai/core/internal";
import type { DatasetExample } from "@matchbox-ai/core";
import type { RecurrentRecipe } from "./types.js";
import { spanTargets } from "./supervision.js";
const schema = z.strictObject({
  tokenizer: textPartsSchema,
  features: textFeaturesSchema,
  labels: z.array(z.string().min(1)).min(2).max(64),
  annotate: z.strictObject({
    kind: z.literal("span-labels"),
    whitespace: z.enum(["context", "supervise"]),
  }),
});
export function readRecipe(value: unknown): RecurrentRecipe {
  const recipe = schema.parse(value);
  if (new Set(recipe.labels).size !== recipe.labels.length) {
    throw new Error("Duplicate recurrent labels.");
  }
  return recipe;
}
export function prepareRecurrent(
  examples: readonly DatasetExample<unknown>[],
  recipe: RecurrentRecipe,
  limits: { maxInputLength: number; maxParts: number },
) {
  const offsets = new Uint32Array(examples.length + 1);
  let count = 0;
  examples.forEach((row, index) => {
    const length = splitParts(row.input).length;
    if (!length || length > limits.maxParts || row.input.length > limits.maxInputLength) {
      throw new Error(
        `Recurrent example ${index + 1} exceeds the configured input/part limits or is empty. No truncation is performed.`,
      );
    }
    count += length;
    if (count > 20_000_000) {
      throw new Error("Recurrent dataset exceeds 20,000,000 parts.");
    }
    offsets[index + 1] = count;
  });
  const features = new Int32Array(count * 16);
  const targets = new Float32Array(count * recipe.labels.length);
  examples.forEach((row, index) => {
    const tokens = splitParts(row.input);
    features.set(encodeParts(tokens), offsets[index]! * 16);
    targets.set(spanTargets(row, tokens, recipe), offsets[index]! * recipe.labels.length);
  });
  return { features, targets, offsets };
}
