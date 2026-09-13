import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import {
  createSequenceParser,
  readSequenceArtifact,
  sequencePredictor,
} from "@matchbox-ai/core/runtime";
import money from "../examples/money/src/generated/money.js";
import parity from "../examples/is-even/src/generated/is-even.js";
import { task, decode, normalizeNumber } from "../examples/money/src";
const artifact = JSON.parse(
  await readFile(
    new URL("../examples/money/src/generated/money.matchbox", import.meta.url),
    "utf8",
  ),
);
const report = JSON.parse(
  await readFile(
    new URL("../examples/money/src/generated/money.matchbox.report.json", import.meta.url),
    "utf8",
  ),
);
describe("trained sequence artifacts", () => {
  test("learned context distinguishes invoice IDs from money without a runtime regex for IDs", async () => {
    expect(await money.parse("invoice 99991 totals € 123.45")).toMatchObject({
      status: "ok",
      value: { amount: 123.45, currency: "EUR", approximate: false },
    });
    const tags = sequencePredictor(readSequenceArtifact(artifact))("invoice 99991 totals € 123.45");
    expect(tags.find((token) => token.text === "99991")?.label).toBe("O");
    expect(tags.find((token) => token.text === "123.45")?.label).toBe("AMOUNT");
  });
  test("the saved weights determine recognition", async () => {
    const blank = structuredClone(artifact);
    for (const matrix of blank.weights) matrix.values.fill(0);
    expect((await createSequenceParser(blank, task, decode).parse("EUR 19.75")).status).toBe(
      "uncertain",
    );
    expect((await money.parse("EUR 19.75")).status).toBe("ok");
  });
  test("rejects incompatible shapes and out-of-range int8 values", () => {
    const badShape = structuredClone(artifact);
    badShape.weights[0].shape[0]++;
    expect(() => readSequenceArtifact(badShape)).toThrow("weights");
    const badWeight = structuredClone(artifact);
    badWeight.weights[2].values[0] = 128;
    expect(() => readSequenceArtifact(badWeight)).toThrow("weights");
  });
  test("checks exported inference and quantization independently of the training engine", () => {
    expect(report.exportParity.labelDisagreements).toBe(0);
    expect(report.exportParity.maxConfidenceError).toBeLessThan(1e-5);
    expect(report.quantized.exactAccuracy).toBe(report.float.exactAccuracy);
    expect(report.loss.at(-1)).toBeLessThan(report.loss[0] / 100);
    expect(report.quantized.exactAccuracy).toBeGreaterThan(report.untrainedUngated.exactAccuracy);
  });
  test("normalization rejects ambiguous decimals and composes supported number words", () => {
    expect(normalizeNumber("1,234.56")).toBe(1234.56);
    expect(normalizeNumber("ninety eight")).toBe(98);
    expect(normalizeNumber("one two")).toBeNull();
    expect(normalizeNumber("1,23")).toBeNull();
    expect(normalizeNumber("1.234")).toBeNull();
  });
  test("abstains on ambiguous currencies, ranges, unsupported precision, and multiple amounts", async () => {
    for (const input of ["$15", "EUR 10 USD", "under 50 euros", "1.234 EUR", "€5 €10"])
      expect((await money.parse(input)).status).toBe("uncertain");
  });
  test("the parity model handles unseen long strings and validates its input", async () => {
    for (const input of ["123456789012345678901234567892", "987654321987654321987654321"])
      expect(await parity.parse(input)).toMatchObject({
        status: "ok",
        value: { even: BigInt(input) % 2n === 0n },
      });
    expect((await parity.parse("2.0")).status).toBe("uncertain");
  });
});
