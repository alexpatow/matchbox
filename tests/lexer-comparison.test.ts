import { expect, test } from "bun:test";
import { score, summarize } from "../apps/benchmarks/src/lexer-comparison/score";

test("lexer comparisons count Unicode code points using UTF-16 span offsets", () => {
  const row = {
    input: "😀 x",
    language: "js",
    output: [
      { type: "string", start: 0, end: 2 },
      { type: "plain", start: 2, end: 3 },
      { type: "keyword", start: 3, end: 4 },
    ],
  };
  const measured = score(row, row.output);
  expect(measured.characters).toBe(2);
  expect(measured.correct).toBe(2);
  expect(measured.exactSpans).toBe(true);
  const abstained = summarize([score(row, null)]);
  expect(abstained.agreement).toBe(0);
  expect(abstained.coverage).toBe(0);
  expect(abstained.styledMacroF1).toBe(0);
});

test("lexer label agreement distinguishes whitespace boundaries from semantic errors", () => {
  const row = {
    input: "x y",
    language: "js",
    output: [
      { type: "keyword", start: 0, end: 1 },
      { type: "plain", start: 1, end: 2 },
      { type: "keyword", start: 2, end: 3 },
    ],
  };
  const sameLabels = score(row, [{ type: "keyword", start: 0, end: 3 }]);
  expect(sameLabels.exactSpans).toBe(false);
  expect(sameLabels.exactLabels).toBe(true);
  const partial = summarize([score(row, [{ type: "keyword", start: 0, end: 1 }])]);
  expect(partial.coverage).toBe(0.5);
  expect(partial.agreement).toBe(0.5);
  expect(partial.exactLabels).toBe(0);
});

test("exact span equality does not depend on object property insertion order", () => {
  const row = { input: "x", language: "js", output: [{ type: "plain", start: 0, end: 1 }] };
  expect(score(row, [{ start: 0, end: 1, type: "plain" }]).exactSpans).toBe(true);
});
