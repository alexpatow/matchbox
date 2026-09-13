import { expect, test } from "bun:test";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

test("packaging is deterministic, held-out labels do not select the model, and failed budgets preserve the previous artifact", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "matchbox-training-"));
  const root = resolve("examples/filters");
  const output = resolve(temporary, "filters.matchbox");
  const configPath = resolve(temporary, "matchbox.config.ts");
  const evaluationPath = resolve(temporary, "evals.jsonl");
  const config = {
    formatVersion: 1,
    sequence: {
      recipe: resolve(root, "recipe.ts"),
      decoder: resolve(root, "src/filter/decode.ts"),
    },
    task: resolve(root, "src/filter/task.ts"),
    baseline: resolve(root, "src/filter/baseline.ts"),
    train: resolve(root, "data/train.jsonl"),
    validation: resolve(root, "data/validation.jsonl"),
    eval: evaluationPath,
    output,
    minAccuracy: 0.95,
    maxBytes: 64000,
  };
  async function train() {
    const child = Bun.spawn(["bun", "packages/train/dist/cli.js", "train", configPath], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const [code, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);
    return { code, stdout, stderr };
  }
  try {
    const evaluation = await readFile(resolve(root, "data/evals.jsonl"), "utf8");
    await writeFile(evaluationPath, evaluation);
    await writeFile(configPath, `export default ${JSON.stringify(config)};`);
    expect((await train()).code).toBe(0);
    const original = await readFile(output, "utf8");
    const changed = evaluation
      .trim()
      .split("\n")
      .map((line) => ({
        ...JSON.parse(line),
        output: { field: "country", operator: "eq", value: "NO" },
      }));
    await writeFile(evaluationPath, changed.map((row) => JSON.stringify(row)).join("\n"));
    expect((await train()).code).toBe(0);
    expect(await readFile(output, "utf8")).toBe(original);
    const report = JSON.parse(await readFile(`${output}.report.json`, "utf8"));
    expect(report.quantized.exactAccuracy).toBeLessThan(1);
    await writeFile(configPath, `export default ${JSON.stringify({ ...config, maxBytes: 1 })};`);
    const failed = await train();
    expect(failed.code).toBe(1);
    expect(failed.stderr).toContain("failed validation/size");
    expect(await readFile(output, "utf8")).toBe(original);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}, 120000);
