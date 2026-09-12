import { expect, test } from "bun:test";
import { parseDatasets, type DatasetConfig } from "@matchbox-ai/core";
import { makeParser } from "./parser-fixture";

const training = { input: "Swedish customers", output: { country: "SE" as const, minimum: 0 } };
const evaluation = { input: "German customers", output: { country: "DE" as const, minimum: 10 } };
function config(
  train = JSON.stringify(training),
  evaluationText = JSON.stringify(evaluation),
): DatasetConfig {
  return {
    formatVersion: 1,
    train: { source: "train.jsonl", text: train },
    eval: { source: "evals.jsonl", text: evaluationText },
  };
}

test("preserves separate typed splits, row order, whitespace, and Unicode", () => {
  const second = { ...training, input: "  kunder i Sverige 🇸🇪\növer 10  " };
  const result = parseDatasets(
    makeParser(),
    config(`\n${JSON.stringify(training)}\r\n  \r\n${JSON.stringify(second)}\r\n`),
  );
  expect(result).toEqual({
    success: true,
    data: { train: [training, second], eval: [evaluation] },
  });
});

test("reports syntax and schema errors from both splits without partial data", () => {
  const result = parseDatasets(
    makeParser(),
    config(
      `${JSON.stringify(training)}\n\n{broken\n${JSON.stringify({ input: 42, output: { country: "US", minimum: -1 } })}`,
      JSON.stringify({ input: "valid input", output: { country: "DE" } }),
    ),
  );
  expect(result.success).toBe(false);
  expect(result).not.toHaveProperty("data");
  if (result.success) throw new Error("Expected invalid examples.");
  expect(
    result.issues.map(({ split, source, line, path }) => ({ split, source, line, path })),
  ).toEqual([
    { split: "train", source: "train.jsonl", line: 3, path: [] },
    { split: "train", source: "train.jsonl", line: 4, path: ["input"] },
    { split: "train", source: "train.jsonl", line: 4, path: ["output", "country"] },
    { split: "train", source: "train.jsonl", line: 4, path: ["output", "minimum"] },
    { split: "eval", source: "evals.jsonl", line: 1, path: ["output", "minimum"] },
  ]);
  expect(result.issues.every((issue) => issue.message.length > 0)).toBe(true);
});

test.each(
  [
    null,
    [],
    "text",
    {},
    { input: "missing output" },
    { output: {} },
    { ...training, typo: true },
  ].map((row) => ({ row })),
)("rejects malformed example envelopes (%#)", ({ row }) => {
  const result = parseDatasets(makeParser(), config(JSON.stringify(row)));
  expect(result.success).toBe(false);
  if (!result.success) expect(result.issues[0]).toMatchObject({ code: "invalid_example", line: 1 });
});

test("requires a nonempty training split and a nonempty held-out split", () => {
  const result = parseDatasets(makeParser(), config("", " \n\r\n"));
  expect(result.success).toBe(false);
  if (!result.success)
    expect(result.issues.map((issue) => [issue.code, issue.split, issue.line])).toEqual([
      ["empty_dataset", "train", 1],
      ["empty_dataset", "eval", 1],
    ]);
});

test("rejects unsupported and missing format versions before reading rows", () => {
  for (const formatVersion of [2, undefined, "1"]) {
    // @ts-expect-error Simulate a caller without TypeScript validation.
    expect(() => parseDatasets(makeParser(), { ...config(), formatVersion })).toThrow(
      "Unsupported dataset formatVersion",
    );
  }
});

test("rejects nonfinite JSON numbers and schema-invalid outputs", () => {
  const result = parseDatasets(
    makeParser(),
    config('{"input":"customers","output":{"country":"SE","minimum":1e400}}'),
  );
  expect(result.success).toBe(false);
  if (!result.success)
    expect(result.issues[0]).toMatchObject({ code: "invalid_json", path: ["output", "minimum"] });
});
