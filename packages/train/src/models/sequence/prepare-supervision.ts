import { tokenize, windows } from "@matchbox-ai/core/internal";
import type { DatasetExample } from "@matchbox-ai/core";
import type { SequenceRecipe } from "./types.js";
export function prepareSupervision(
  examples: readonly DatasetExample<unknown>[],
  recipe: SequenceRecipe,
  radius = 1,
) {
  if (!Number.isInteger(radius) || radius < 1 || radius > 16) {
    throw new Error("contextRadius must be an integer between 1 and 16.");
  }
  if (recipe.casing !== undefined && !["preserve", "lowercase"].includes(recipe.casing)) {
    throw new Error("casing must be preserve or lowercase.");
  }
  const keys = new Set<string>();
  let tokenCount = 0;
  for (const example of examples) {
    for (const token of tokenize(example.input, recipe.tokenizer, recipe.casing)) {
      keys.add(token.key);
      tokenCount++;
    }
  }
  const vocabulary = [...keys].sort();
  const dropout = recipe.tokenDropout ?? 0;
  if (!Number.isFinite(dropout) || dropout < 0 || dropout > 0.5) {
    throw new Error("tokenDropout must be between 0 and 0.5.");
  }
  let maskingSeed = 7043;
  const random = () => {
    maskingSeed = (Math.imul(maskingSeed, 1664525) + 1013904223) >>> 0;
    return maskingSeed / 4294967296;
  };
  const width = radius * 2 + 1;
  const capacity = tokenCount * (dropout > 0 ? 2 : 1);
  const inputs = new Int32Array(capacity * width);
  const labels = new Int32Array(capacity);
  const observed = new Set<number>();
  let count = 0;
  const append = (window: number[], id: number) => {
    inputs.set(window, count * width);
    labels[count++] = id;
    observed.add(id);
  };
  for (const example of examples) {
    const tokens = tokenize(example.input, recipe.tokenizer, recipe.casing);
    const annotations = recipe.annotate(example, tokens);
    if (annotations.length !== tokens.length) {
      throw new Error(`Annotation length mismatch: ${example.input}`);
    }
    windows(tokens, vocabulary, radius).forEach((window, position) => {
      const label = annotations[position];
      if (label === null) {
        return;
      }
      const id = recipe.labels.indexOf(label!);
      if (id < 0) {
        throw new Error(`Unknown annotation ${label}: ${example.input}`);
      }
      append(window, id);
      if (dropout > 0) {
        append(
          window.map((id) => (id > 1 && random() < dropout ? 1 : id)),
          id,
        );
      }
    });
  }
  if (recipe.labels.some((_, id) => !observed.has(id))) {
    throw new Error("Every label needs supervised training examples.");
  }
  // Mix currency/template blocks deterministically before minibatch optimization.
  maskingSeed = 9187;
  for (let index = count - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    for (let offset = 0; offset < width; offset++) {
      const left = index * width + offset;
      const right = other * width + offset;
      [inputs[left], inputs[right]] = [inputs[right]!, inputs[left]!];
    }
    [labels[index], labels[other]] = [labels[other]!, labels[index]!];
  }
  return {
    vocabulary,
    radius,
    dropout,
    inputs: inputs.subarray(0, count * width),
    labels: labels.subarray(0, count),
  };
}
