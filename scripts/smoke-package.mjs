import assert from "node:assert/strict";
import { readFile, mkdir, writeFile, cp } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const root = resolve(process.argv[2] ?? ".packed-smoke");
const trainRoot = resolve(root, "node_modules/@matchbox-ai/train");
const manifest = JSON.parse(await readFile(resolve(trainRoot, "package.json"), "utf8"));
assert(!manifest.scripts.install && !manifest.scripts.postinstall);
await writeFile(
  resolve(root, "import-train.mjs"),
  'export { train } from "@matchbox-ai/train"; export { loadArtifact } from "@matchbox-ai/train/project";\n',
);
const { train, loadArtifact } = await import(pathToFileURL(resolve(root, "import-train.mjs")));
const taskRoot = resolve(root, "matchbox/example");
await mkdir(resolve(taskRoot, "data"), { recursive: true });
await mkdir(resolve(taskRoot, "evals"), { recursive: true });
await writeFile(
  resolve(taskRoot, "parser.ts"),
  `import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";
export default defineParser({ input: z.string(), output: z.strictObject({ size: z.enum(["small", "large"]) }) });\n`,
);
await writeFile(
  resolve(taskRoot, "pipeline.ts"),
  `import { definePipeline, fieldClassifier } from "@matchbox-ai/train";
export default definePipeline({ prediction: fieldClassifier() });\n`,
);
const rows = ["small", "large"].flatMap((size) =>
  ["please send", "we need", "give us"].map((prefix) => ({
    input: prefix + " " + size,
    output: { size },
  })),
);
await writeFile(
  resolve(taskRoot, "data/train.jsonl"),
  rows.map((row) => JSON.stringify(row)).join("\n") + "\n",
);
await writeFile(
  resolve(taskRoot, "evals/validation.jsonl"),
  JSON.stringify({ input: "send small", output: { size: "small" } }) + "\n",
);
await writeFile(
  resolve(taskRoot, "evals/test.jsonl"),
  JSON.stringify({ input: "need large", output: { size: "large" } }) + "\n",
);
const result = await train(taskRoot);
assert.equal(result.report.evaluation.exactAccuracy, 1);
const { parser } = await loadArtifact(taskRoot);
assert.deepEqual((await parser.parse("send large")).value, { size: "large" });
parser.dispose();
const recurrentRoot = resolve(root, "matchbox/recurrent");
await cp(
  new URL("../tests/fixtures/recurrent-classifier/matchbox/parts/", import.meta.url),
  recurrentRoot,
  { recursive: true },
);
const recurrentResult = await train(recurrentRoot);
assert.equal(recurrentResult.report.exportParity.labelDisagreements, 0);
const recurrent = await loadArtifact(recurrentRoot);
assert.equal(recurrent.parser.supportsPartial, true);
const partial = await recurrent.parser.parse("black?", { allowPartial: true });
assert(["ok", "partial"].includes(partial.status));
assert(recurrent.task.validateOutput(partial.value).success);
recurrent.parser.dispose();
console.log(
  `Packed package trained and inferred successfully on ${process.platform}-${process.arch}.`,
);
