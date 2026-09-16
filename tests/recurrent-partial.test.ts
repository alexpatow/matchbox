import { expect, test } from "bun:test";
import { z } from "zod";
import { defineParser } from "@matchbox-ai/core";
import { readRecurrentArtifact, splitParts } from "@matchbox-ai/core/internal";
import { createRecurrentParser } from "../packages/core/src/internal/recurrent/create-parser";
const task = defineParser({
  input: z.string(),
  output: z.array(
    z.strictObject({ label: z.enum(["a", "b"]), start: z.number(), end: z.number() }),
  ),
});
const model = readRecurrentArtifact({
  formatVersion: 5,
  engine: "burn-0.21",
  kind: "recurrent-parser",
  architecture: "bidirectional-affine",
  taskModule: "./parser.ts",
  decoderModule: "./decode.ts",
  taskMetadata: task.toJSON(),
  tokenizer: { kind: "text-parts", version: 1 },
  features: { kind: "text-features", version: 1 },
  labels: ["a", "b"],
  supervision: "non-whitespace",
  threshold: 0.75,
  maxInputLength: 100,
  maxParts: 10,
  precision: "float32",
  weights: "AAAA",
});
const decode = (tokens: readonly ReturnType<typeof splitParts>[number][]) =>
  tokens.map(({ start, end }) => ({ label: "a", start, end }));
function parser(scores: number[], decoder = decode) {
  return createRecurrentParser(model, task, decoder, (input) =>
    splitParts(input).map((token, index) => ({ ...token, label: "a", confidence: scores[index]! })),
  );
}
test("partial parsing is explicit and preserves minimum confidence with UTF-16 ranges", async () => {
  const runtime = parser([0.95, 0.1, 0.4, 0.6]);
  expect(await runtime.parse("😀 +!")).toMatchObject({
    status: "uncertain",
    value: null,
    confidence: 0.4,
  });
  const result = await runtime.parse("😀 +!", { allowPartial: true });
  expect(result).toMatchObject({
    status: "partial",
    confidence: 0.4,
    uncertainRanges: [{ start: 3, end: 5, confidence: 0.4 }],
  });
  expect(await runtime.parse("😀 +!", { allowPartial: false })).toMatchObject({
    status: "uncertain",
    value: null,
  });
});
test("all-uncertain input, unsupported limits and invalid decoded output never become partial", async () => {
  expect(await parser([0.3, 0.4]).parse("a+", { allowPartial: true })).toMatchObject({
    status: "uncertain",
    value: null,
  });
  expect(await parser([]).parse("a".repeat(101), { allowPartial: true })).toMatchObject({
    status: "uncertain",
    value: null,
  });
  expect(
    await parser([0.95, 0.4], () => [{ label: "invalid", start: 0, end: 2 }]).parse("a+", {
      allowPartial: true,
    }),
  ).toMatchObject({ status: "uncertain", value: null });
  expect(await parser([0.95, 0.95]).parse("a+", { allowPartial: true })).toMatchObject({
    status: "ok",
    confidence: 0.95,
  });
});
