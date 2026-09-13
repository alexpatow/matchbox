import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { defineParser } from "@matchbox-ai/core";
import { createParser } from "@matchbox-ai/core/runtime";
import { readRecordArtifact } from "@matchbox-ai/core/internal";
import { z } from "zod";
import { fitRecord } from "../packages/train/src/models/record/fit.js";
import simple from "../examples/money-simple/.matchbox/money/model.js";

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
  expect(await createParser(first.quantized, task).parse("please give us dax")).toMatchObject({
    status: "ok",
    value: { amount: 15 },
  });
  expect(await createParser(second.quantized, task).parse("please give us dax")).toMatchObject({
    status: "ok",
    value: { amount: 20 },
  });
  expect(first.quantized.fields).toEqual(second.quantized.fields);
  expect(first.quantized.weights).not.toEqual(second.quantized.weights);
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
    await readFile("examples/money-simple/.matchbox/money/model.matchbox", "utf8"),
  );
  artifact.weights[0].shape[0]++;
  expect(() => readRecordArtifact(artifact)).toThrow("weights");
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
