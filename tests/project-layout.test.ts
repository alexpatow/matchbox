import { expect, test } from "bun:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { discover } from "../packages/train/src/project/index.js";
import { definePipeline, fieldClassifier, tokenClassifier, wordTokens } from "@matchbox-ai/train";

test("named tasks resolve from nested directories and ambiguity never selects silently", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "matchbox-discovery-"));
  try {
    for (const name of ["money", "dates"]) {
      await mkdir(resolve(root, "matchbox", name, "data"), { recursive: true });
      await writeFile(resolve(root, "matchbox", name, "parser.ts"), "export default {};\n");
    }
    const money = resolve(root, "matchbox/money");
    await expect(discover(undefined, root)).rejects.toThrow("Choose a task: dates, money");
    expect(await discover("money", root)).toBe(money);
    expect(await discover(undefined, resolve(money, "data"))).toBe(money);
    expect(await discover("dates", resolve(money, "data"))).toBe(resolve(root, "matchbox/dates"));
    await expect(discover("missing", root)).rejects.toThrow("Task not found");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("pipeline definitions make encoder and supervision choices explicit", () => {
  expect(
    definePipeline({ input: wordTokens(), prediction: fieldClassifier() }).prediction.kind,
  ).toBe("field-classifier");
  expect(() => definePipeline({ prediction: fieldClassifier() })).toThrow("explicit input encoder");
  expect(() =>
    definePipeline({
      input: wordTokens(),
      prediction: tokenClassifier({ recipe: "./recipe.ts", decode: "./decode.ts" }),
    }),
  ).toThrow("recipe owns tokenization");
});
