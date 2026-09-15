import { expect, test } from "bun:test";
import { sequenceParity } from "../packages/train/src/models/sequence/export-parity.js";

test("measured full-corpus float32 drift passes without hiding its magnitude", () => {
  const parity = sequenceParity(0.75);
  parity.add(
    { label: "number", confidence: 0.6656225323677063 },
    { label: "number", confidence: 0.6656074523925781 },
  );
  expect(parity.report()).toEqual({
    tokens: 1,
    maxConfidenceError: 0.000015079975128173828,
    confidenceTolerance: 1e-4,
    labelDisagreements: 0,
    acceptanceDisagreements: 0,
  });
});

test("label disagreement fails even with identical low confidence", () => {
  const parity = sequenceParity(0.75);
  parity.add({ label: "a", confidence: 0.4 }, { label: "b", confidence: 0.4 });
  expect(() => parity.report()).toThrow('"labelDisagreements":1');
});

test("tiny drift across the inclusive acceptance threshold fails in either direction", () => {
  for (const [native, portable] of [
    [0.75, 0.749999],
    [0.749999, 0.75],
  ]) {
    const parity = sequenceParity(0.75);
    parity.add({ label: "a", confidence: native! }, { label: "a", confidence: portable! });
    expect(() => parity.report()).toThrow('"acceptanceDisagreements":1');
  }
});

test("confidence differences beyond tolerance still fail with diagnostic details", () => {
  const parity = sequenceParity(0.75);
  parity.add({ label: "a", confidence: 0.8 }, { label: "a", confidence: 0.801 });
  expect(() => parity.report()).toThrow('"maxConfidenceError":');
});

test("non-finite confidence cannot bypass the parity guard", () => {
  for (const confidence of [NaN, Infinity, -Infinity]) {
    const parity = sequenceParity(0.75);
    expect(() => parity.add({ label: "a", confidence }, { label: "a", confidence: 0.8 })).toThrow(
      "non-finite",
    );
  }
});
