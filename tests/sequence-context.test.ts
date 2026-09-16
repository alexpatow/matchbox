import { expect, test } from "bun:test";
import { tokenize, windows, readSequenceArtifact } from "@matchbox-ai/core/internal";
import { definePipeline, tokenClassifier } from "@matchbox-ai/train";
import { prepareSupervision } from "../packages/train/src/models/sequence/prepare-supervision";
import type { SequenceRecipe } from "@matchbox-ai/train";

const recipe: SequenceRecipe = {
  tokenizer: "characters",
  casing: "preserve",
  readout: "all",
  labels: ["upper", "lower"],
  annotate: (_, tokens) => tokens.map((token) => (token.text === "A" ? "upper" : "lower")),
};
test("case preservation keeps Unicode code points and UTF-16 offsets intact", () => {
  const tokens = tokenize("Aİ😀a", "characters", "preserve");
  expect(tokens.map(({ key, start, end }) => [key, start, end])).toEqual([
    ["A", 0, 1],
    ["İ", 1, 2],
    ["😀", 2, 4],
    ["a", 4, 5],
  ]);
  expect(tokenize("Aa", "characters").map((token) => token.key)).toEqual(["a", "a"]);
});
test("context windows pad each document independently and preserve unknown IDs", () => {
  expect(windows(tokenize("Ab", "characters", "preserve"), ["A"], 2)).toEqual([
    [0, 0, 2, 1, 0],
    [0, 2, 1, 0, 0],
  ]);
  const result = prepareSupervision(
    [
      { input: "A", output: null },
      { input: "a", output: null },
    ],
    recipe,
    4,
  );
  expect(result.vocabulary).toEqual(["A", "a"]);
  expect(result.labels.length).toBe(2);
  for (let row = 0; row < 2; row++) {
    const window = [...result.inputs.slice(row * 9, (row + 1) * 9)];
    expect(window.filter((id) => id !== 0)).toHaveLength(1);
    expect(window[4]).toBe(result.labels[row] === 0 ? 2 : 3);
  }
});
test("context radius is validated at both authoring and supervision boundaries", () => {
  for (const contextRadius of [0, -1, 1.5, 17, NaN, Infinity]) {
    expect(() => definePipeline({ prediction: tokenClassifier({ contextRadius }) })).toThrow();
    expect(() => prepareSupervision([], recipe, contextRadius)).toThrow("contextRadius");
  }
});
test("legacy artifacts cannot silently opt into a new encoding or window shape", () => {
  const legacy = {
    engine: "burn-0.21",
    kind: "sequence-parser",
    architecture: "embedding-window-mlp",
    taskModule: "./parser.ts",
    decoderModule: "./decode.ts",
    taskMetadata: {},
    tokenizer: "characters",
    readout: "all",
    vocabulary: ["a"],
    labels: ["upper", "lower"],
    unknownTokens: "abstain",
    threshold: 0.75,
    precision: "float32",
    weights: "AAAA",
  };
  const original = { ...legacy, formatVersion: 3, radius: 1 };
  expect(readSequenceArtifact(original).radius).toBe(1);
  expect(() => readSequenceArtifact({ ...original, radius: 4 })).toThrow();
  expect(() => readSequenceArtifact({ ...original, casing: "preserve" })).toThrow();
  expect(
    readSequenceArtifact({ ...original, formatVersion: 4, radius: 4, casing: "preserve" }).casing,
  ).toBe("preserve");
});
