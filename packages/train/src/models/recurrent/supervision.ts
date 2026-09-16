import type { DatasetExample } from "@matchbox-ai/core";
import type { Token } from "@matchbox-ai/core/runtime";
import type { RecurrentRecipe } from "./types.js";
import { z } from "zod";
const spansSchema = z.array(
  z.strictObject({
    type: z.string(),
    start: z.number().int().nonnegative(),
    end: z.number().int().positive(),
  }),
);
export function spanTargets(
  example: DatasetExample<unknown>,
  tokens: readonly Token[],
  recipe: RecurrentRecipe,
): Float32Array {
  const spans = spansSchema.parse(example.output);
  const labels = new Map(recipe.labels.map((label, id) => [label, id]));
  let end = 0;
  for (const span of spans) {
    if (
      span.start < end ||
      span.end <= span.start ||
      span.end > example.input.length ||
      !labels.has(span.type)
    ) {
      throw new Error(
        "Supervision spans must be ordered, non-overlapping, in bounds and use declared labels.",
      );
    }
    for (const offset of [span.start, span.end]) {
      const code = example.input.charCodeAt(offset);
      const previous = example.input.charCodeAt(offset - 1);
      if (code >= 0xdc00 && code <= 0xdfff && previous >= 0xd800 && previous <= 0xdbff) {
        throw new Error("Supervision spans must not split a Unicode code point.");
      }
    }
    end = span.end;
  }
  const result = new Float32Array(tokens.length * recipe.labels.length);
  let spanIndex = 0;
  tokens.forEach((token, index) => {
    for (let offset = token.start; offset < token.end;) {
      const character = String.fromCodePoint(example.input.codePointAt(offset)!);
      while (spanIndex < spans.length && spans[spanIndex]!.end <= offset) {
        spanIndex++;
      }
      if (recipe.annotate.whitespace === "supervise" || character.trim()) {
        const span = spans[spanIndex];
        if (!span || span.start > offset || span.end < offset + character.length) {
          throw new Error(`Missing span supervision at UTF-16 offset ${offset}.`);
        }
        result[index * recipe.labels.length + labels.get(span.type)!]!++;
      }
      offset += character.length;
    }
  });
  return result;
}
