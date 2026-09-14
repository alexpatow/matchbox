import { expect, test } from "bun:test";
import { prepareSupervision } from "../packages/train/src/models/sequence/prepare-supervision";
import type { SequenceRecipe } from "@matchbox-ai/train";
const recipe: SequenceRecipe = {
  tokenizer: "words",
  readout: "all",
  labels: ["O", "VALUE"],
  annotate: (_, tokens) => tokens.map((t) => (t.key === "<number>" ? "VALUE" : "O")),
};
const rows = Array.from({ length: 30 }, (_, i) => ({ input: `amount ${i}`, output: i }));
test("masking trains the unknown ID deterministically without changing labels or padding", () => {
  const plain = prepareSupervision(rows, recipe);
  const maskedRecipe = { ...recipe, tokenDropout: 0.5 };
  const masked = prepareSupervision(rows, maskedRecipe);
  expect(masked).toEqual(prepareSupervision(rows, maskedRecipe));
  expect(masked.vocabulary).toEqual(plain.vocabulary);
  expect(masked.inputs.length).toBe(2 * plain.inputs.length);
  expect(masked.inputs.some((window) => window.includes(1))).toBe(true);
  expect(masked.inputs.every((window) => window[0] === 0 || window[2] === 0)).toBe(true);
  for (const id of [0, 1])
    expect(masked.labels.filter((label) => label === id).length).toBe(
      2 * plain.labels.filter((label) => label === id).length,
    );
});
test("invalid probabilities and misaligned supervision fail before training", () => {
  for (const tokenDropout of [-1, 0.51, NaN, Infinity])
    expect(() => prepareSupervision(rows, { ...recipe, tokenDropout })).toThrow("tokenDropout");
  expect(() => prepareSupervision(rows, { ...recipe, annotate: () => [] })).toThrow(
    "length mismatch",
  );
});
