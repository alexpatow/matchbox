import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { createParser } from "@matchbox-ai/core/runtime";
import { readSequenceArtifact, tensorPredictor } from "@matchbox-ai/core/internal";
import money from "../examples/money/.matchbox/money/model.js";
import parity from "../examples/is-even/.matchbox/is-even/model.js";
import task from "../examples/money/matchbox/money/parser";
import decode from "../examples/money/matchbox/money/decode/decode";
import { normalizeNumber } from "../examples/money/matchbox/money/decode/number-words";
const artifact = JSON.parse(
  await readFile(
    new URL("../examples/money/.matchbox/money/model.matchbox", import.meta.url),
    "utf8",
  ),
);
const report = JSON.parse(
  await readFile(new URL("../examples/money/.matchbox/money/report.json", import.meta.url), "utf8"),
);
describe("trained sequence artifacts", () => {
  test("learned context distinguishes invoice IDs from money without a runtime regex for IDs", async () => {
    expect(await money.parse("invoice 99991 totals € 123.45")).toMatchObject({
      status: "ok",
      value: { amount: 123.45, currency: "EUR", approximate: false },
    });
    const predictor = await tensorPredictor(readSequenceArtifact(artifact));
    const tags = predictor.sequence("invoice 99991 totals € 123.45");
    predictor.dispose();
    expect(tags.find((token) => token.text === "99991")?.label).toBe("O");
    expect(tags.find((token) => token.text === "123.45")?.label).toBe("AMOUNT");
  });
  test("rejects unreadable Burn records before returning predictions", async () => {
    const blank = structuredClone(artifact);
    blank.weights = "AA==";
    const invalid = createParser(blank, task, decode);
    await expect(invalid.parse("EUR 19.75")).rejects.toThrow();
    invalid.dispose();
    expect((await money.parse("EUR 19.75")).status).toBe("ok");
  });
  test("rejects incompatible shapes and malformed serialized weights", async () => {
    const badShape = structuredClone(artifact);
    badShape.vocabulary.push("new-untrained-token");
    const invalid = createParser(badShape, task, decode);
    await expect(invalid.load()).rejects.toThrow("dimensions");
    invalid.dispose();
    const badWeight = structuredClone(artifact);
    badWeight.weights = "not base64!";
    expect(() => readSequenceArtifact(badWeight)).toThrow();
  });
  test("checks export fidelity and training loss", () => {
    expect(report.exportParity.labelDisagreements).toBe(0);
    expect(report.exportParity.maxConfidenceError).toBeLessThan(1e-5);
    expect(report).not.toHaveProperty("float");
    expect(report).not.toHaveProperty("quantized");
    expect(report.formatVersion).toBe(2);
    // Epoch averages change with dataset size and masking. Task accuracy gates export.
    expect(report.loss.at(-1)).toBeLessThan(report.loss[0] / 10);
    expect(report.evaluation.exactAccuracy).toBeGreaterThanOrEqual(0.95);
  });
  test("normalization rejects ambiguous decimals and composes supported number words", () => {
    expect(normalizeNumber("1,234.56")).toBe(1234.56);
    expect(normalizeNumber("ninety eight")).toBe(98);
    expect(normalizeNumber("one two")).toBeNull();
    expect(normalizeNumber("1,23")).toBeNull();
    expect(normalizeNumber("1.234")).toBeNull();
  });
  test("abstains on ambiguous currencies, ranges, unsupported precision, and multiple amounts", async () => {
    for (const input of ["EUR 10 USD", "under 50 euros", "1.234 EUR", "€5 €10"]) {
      expect((await money.parse(input)).status).toBe("uncertain");
    }
  });
  test("the parity model handles unseen long strings and validates its input", async () => {
    for (const input of ["123456789012345678901234567892", "987654321987654321987654321"]) {
      expect(await parity.parse(input)).toMatchObject({
        status: "ok",
        value: { even: BigInt(input) % 2n === 0n },
      });
    }
    expect((await parity.parse("2.0")).status).toBe("uncertain");
  });
});

test("the money example interprets the dollar symbol as USD", async () => {
  expect(await money.parse("$15")).toMatchObject({
    status: "ok",
    value: { amount: 15, currency: "USD", approximate: false },
  });
});
