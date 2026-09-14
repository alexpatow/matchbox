import { tokenize, windows } from "@matchbox-ai/core/internal";
import type { DatasetExample } from "@matchbox-ai/core";
import type { SequenceRecipe } from "./types.js";
export function prepareSupervision(
  examples: readonly DatasetExample<unknown>[],
  recipe: SequenceRecipe,
  shuffleLabels = false,
) {
  const vocabulary = [
    ...new Set(
      examples.flatMap((row) => tokenize(row.input, recipe.tokenizer).map((token) => token.key)),
    ),
  ].sort();
  const radius = 1;
  const dropout = recipe.tokenDropout ?? 0;
  if (!Number.isFinite(dropout) || dropout < 0 || dropout > 0.5) {
    throw new Error("tokenDropout must be between 0 and 0.5.");
  }
  let maskingSeed = 7043;
  const random = () => {
    maskingSeed = (Math.imul(maskingSeed, 1664525) + 1013904223) >>> 0;
    return maskingSeed / 4294967296;
  };
  const inputs: number[][] = [];
  const labels: number[] = [];
  for (const example of examples) {
    const tokens = tokenize(example.input, recipe.tokenizer);
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
      inputs.push(window);
      labels.push(id);
      if (dropout > 0) {
        inputs.push(window.map((id) => (id > 1 && random() < dropout ? 1 : id)));
        labels.push(id);
      }
    });
  }
  if (recipe.labels.some((_, id) => !labels.includes(id))) {
    throw new Error("Every label needs supervised training examples.");
  }
  // Mix currency/template blocks deterministically before minibatch optimization.
  maskingSeed = 9187;
  for (let index = inputs.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [inputs[index], inputs[other]] = [inputs[other]!, inputs[index]!];
    [labels[index], labels[other]] = [labels[other]!, labels[index]!];
  }
  if (shuffleLabels) {
    let state = 173;
    for (let index = labels.length - 1; index > 0; index--) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const other = state % (index + 1);
      [labels[index], labels[other]] = [labels[other]!, labels[index]!];
    }
  }
  return { vocabulary, radius, dropout, inputs, labels };
}
