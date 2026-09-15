import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { defineParser } from "@matchbox-ai/core";
import { createParser } from "@matchbox-ai/core/runtime";
import { readRecordArtifact } from "@matchbox-ai/core/internal";
import { z } from "zod";
import { fitRecord } from "../packages/train/src/models/record/fit.js";
import simple from "../tests/fixtures/field-classifier/.matchbox/money/model.js";

test("new word meanings are learned by changing examples alone", async () => {
  const task = defineParser({ input: z.string(), output: z.strictObject({ amount: z.number() }) });
  const train = (meaning: number) =>
    ["please", "send", "we need", "give us"].flatMap((prefix) => [
      { input: `${prefix} dax`, output: { amount: meaning } },
      { input: `${prefix} small`, output: { amount: 15 } },
      { input: `${prefix} large`, output: { amount: 20 } },
    ]);
  const metadata = { taskModule: "./task.ts", taskMetadata: task.toJSON() };
  const first = await fitRecord(train(15), metadata, ["please give us dax"]);
  const second = await fitRecord(train(20), metadata, ["please give us dax"]);
  expect(await createParser(first.model, task).parse("please give us dax")).toMatchObject({
    status: "ok",
    value: { amount: 15 },
  });
  expect(await createParser(second.model, task).parse("please give us dax")).toMatchObject({
    status: "ok",
    value: { amount: 20 },
  });
  expect(first.model.fields).toEqual(second.model.fields);
  expect(first.model.weights).not.toEqual(second.model.weights);
  expect(first.parity.labelDisagreements + second.parity.labelDisagreements).toBe(0);
  expect(first.parity.maxConfidenceError).toBeLessThan(1e-5);
}, 30000);

test("simple pipeline predicts structured values and abstains on unseen numeric vocabulary", async () => {
  expect(await simple.parse("around fifteen grand euros")).toMatchObject({
    status: "ok",
    value: { amount: 15000, currency: "EUR", approximate: true },
  });
  expect((await simple.parse("123.45 euros")).status).toBe("uncertain");
  const artifact = JSON.parse(
    await readFile("tests/fixtures/field-classifier/.matchbox/money/model.matchbox", "utf8"),
  );
  artifact.weights = "invalid base64";
  expect(() => readRecordArtifact(artifact)).toThrow();
});

test("boolean defaults are captured once and remain typed schema behavior", () => {
  let value = false;
  const task = defineParser({
    input: z.string(),
    output: z.strictObject({ approximate: z.boolean().default(() => value) }),
  });
  value = true;
  expect(task.validateOutput({})).toEqual({ success: true, data: { approximate: false } });
  expect(task.toJSON().output.properties?.approximate).toMatchObject({
    type: "boolean",
    default: false,
  });
});
