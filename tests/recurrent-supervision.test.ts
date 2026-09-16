import { expect, test } from "bun:test";
import { splitParts, encodeParts, featureCount } from "@matchbox-ai/core/internal";
import {
  textParts,
  textFeatures,
  spanLabels,
  recurrentTokenClassifier,
  definePipeline,
} from "@matchbox-ai/train";
import { prepareRecurrent, readRecipe } from "../packages/train/src/models/recurrent/prepare";
import { spanTargets } from "../packages/train/src/models/recurrent/supervision";
const recipe = {
  tokenizer: textParts(),
  features: textFeatures(),
  labels: ["a", "b"],
  annotate: spanLabels({ whitespace: "context" }),
};
test("parts preserve source, CRLF and Unicode offsets without a vocabulary", () => {
  const input = "foo\t 😀é\r\n+=bar";
  const tokens = splitParts(input);
  expect(tokens.map((token) => token.text)).toEqual(["foo", "\t ", "😀é", "\r\n", "+", "=", "bar"]);
  expect(tokens.map((token) => input.slice(token.start, token.end)).join("")).toBe(input);
  const features = encodeParts(tokens);
  expect(features.length).toBe(tokens.length * 16);
  expect([...features].every((id) => id >= 0 && id < featureCount)).toBe(true);
  expect([...features.slice(32, 48)].some((id) => id > 0)).toBe(true);
});
test("span supervision preserves minority labels and counts code points", () => {
  const input = "a😀b \r\n";
  const output = [
    { type: "a", start: 0, end: 3 },
    { type: "b", start: 3, end: 4 },
  ];
  expect([...spanTargets({ input, output }, splitParts(input), recipe)]).toEqual([
    2, 1, 0, 0, 0, 0,
  ]);
  expect(() =>
    spanTargets({ input, output: [{ type: "a", start: 0, end: 2 }] }, splitParts(input), recipe),
  ).toThrow("Unicode");
  expect(() => spanTargets({ input, output: [] }, splitParts(input), recipe)).toThrow(
    "Missing span",
  );
  expect(() =>
    spanTargets(
      { input, output: [{ type: "missing", start: 0, end: 4 }] },
      splitParts(input),
      recipe,
    ),
  ).toThrow("declared labels");
});
test("recurrent datasets enforce limits and keep documents separate", () => {
  const rows = ["aa", "bb"].map((input, index) => ({
    input,
    output: [{ type: recipe.labels[index], start: 0, end: 2 }],
  }));
  const prepared = prepareRecurrent(rows, recipe, { maxInputLength: 2, maxParts: 1 });
  expect([...prepared.offsets]).toEqual([0, 1, 2]);
  expect([...prepared.targets]).toEqual([2, 0, 0, 2]);
  expect(() => prepareRecurrent(rows, recipe, { maxInputLength: 1, maxParts: 1 })).toThrow(
    "No truncation",
  );
  expect(() => readRecipe({ ...recipe, labels: ["a", "a"] })).toThrow("Duplicate");
  for (const maxParts of [0, 65537, NaN]) {
    expect(() => definePipeline({ prediction: recurrentTokenClassifier({ maxParts }) })).toThrow();
  }
});

test("version-one feature IDs retain the measured artifact encoding", () => {
  // Frozen encoding shared with the full-corpus research comparison.
  expect([...encodeParts(splitParts("Foo(1)"))]).toEqual([
    1, 6, 83, 252, 388, 608, 653, 654, 657, 743, 0, 0, 0, 0, 0, 0, 4, 5, 53, 181, 711, 746, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 1, 5, 62, 190, 297, 581, 655, 714, 744, 0, 0, 0, 0, 0, 0, 0, 4, 5, 54, 182,
    712, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);
});
