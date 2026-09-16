import { expect, test } from "bun:test";
import { partTargets } from "../scripts/sequence-research/parts/targets.js";

test("part supervision preserves mixed labels and Unicode code-point counts", () => {
  const targets = partTargets(
    "😀x 42",
    [
      { start: 0, end: 2, type: "string" },
      { start: 2, end: 3, type: "keyword" },
      { start: 4, end: 6, type: "number" },
    ],
    Uint32Array.of(0, 3, 3, 4, 4, 6),
    ["plain", "string", "keyword", "number"],
  );
  expect(targets).toEqual([
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 2],
  ]);
});

test("unlabeled characters remain plain and unknown labels fail preparation", () => {
  expect(partTargets("a b", [], Uint32Array.of(0, 3), ["plain", "string"])).toEqual([[2, 0]]);
  expect(() =>
    partTargets("x", [{ start: 0, end: 1, type: "unknown" }], Uint32Array.of(0, 1), ["plain"]),
  ).toThrow("Unknown label unknown");
});
