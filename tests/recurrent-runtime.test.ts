import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { createParser } from "@matchbox-ai/core/runtime";
import { readRecurrentArtifact } from "@matchbox-ai/core/internal";
import task from "./fixtures/recurrent-classifier/matchbox/parts/parser";
import decode from "./fixtures/recurrent-classifier/matchbox/parts/decode";
import model from "./fixtures/recurrent-classifier/.matchbox/parts/model";
const root = new URL("./fixtures/recurrent-classifier/", import.meta.url);
test("generated recurrent wrappers retain typed partial parsing and portable Burn execution", async () => {
  const report = JSON.parse(await readFile(new URL(".matchbox/parts/report.json", root), "utf8"));
  expect(report.exportParity.labelDisagreements).toBe(0);
  expect(report.exportParity.acceptanceDisagreements).toBe(0);
  expect(report.parts.train).toBe(48);
  const rows = (await readFile(new URL("matchbox/parts/evals/test.jsonl", root), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  for (const row of rows) {
    const result = await model.parse(row.input);
    const failure = report.evaluation.failures.find(
      (entry: { input: string }) => entry.input === row.input,
    );
    expect(result.value).toEqual(failure ? failure.actual : row.output);
    const partial = await model.parse(row.input, { allowPartial: true });
    if (partial.status !== "uncertain") {
      expect(task.validateOutput(partial.value).success).toBe(true);
    }
  }
  model.dispose();
  await expect(model.parse("cat!")).rejects.toThrow("disposed");
});
test("recurrent records validate metadata, feature encoding and declared weight dimensions", async () => {
  const raw = JSON.parse(await readFile(new URL(".matchbox/parts/model.matchbox", root), "utf8"));
  expect(() =>
    readRecurrentArtifact({ ...raw, features: { kind: "text-features", version: 2 } }),
  ).toThrow();
  const wrong = readRecurrentArtifact({ ...raw, labels: ["a", "b", "c"] });
  const parser = createParser(wrong, task, decode);
  await expect(parser.load()).rejects.toThrow("dimensions");
  parser.dispose();
  const limited = createParser(readRecurrentArtifact({ ...raw, maxParts: 1 }), task, decode);
  expect(await limited.parse("cat!", { allowPartial: true })).toMatchObject({
    status: "uncertain",
    value: null,
  });
  limited.dispose();
});
