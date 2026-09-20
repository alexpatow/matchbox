import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import model from "../.matchbox/shapes/model";
import { recognize } from "../matchbox/shapes/recognize";
import type { Stroke } from "../matchbox/shapes/parser";
const root = resolve(import.meta.dir, "..");
const text = await readFile(resolve(root, "matchbox/shapes/evals/test.jsonl"), "utf8");
const rows = text
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line) as { input: Stroke; output: { kind: string } });
const confusion: Record<string, Record<string, number>> = {};
let correct = 0;
for (const row of rows) {
  const result = await recognize(model, row.input);
  const predicted = result.status === "ok" ? result.value.kind : "uncertain";
  const expected = row.output.kind === "unknown" ? "uncertain" : row.output.kind;
  if (predicted === expected) {
    correct++;
  }
  confusion[expected] ??= {};
  confusion[expected]![predicted] = (confusion[expected]![predicted] ?? 0) + 1;
}
const report = JSON.parse(await readFile(resolve(root, ".matchbox/shapes/report.json"), "utf8"));
const result = {
  scope:
    "Synthetic test strokes from the same generator family as training. Not a human-drawing benchmark. Conversion checks class or rejection, not geometric fidelity.",
  examples: rows.length,
  testSha256: createHash("sha256").update(text).digest("hex"),
  artifactSha256: report.artifactSha256,
  bytes: report.bytes,
  parameters: report.parameters,
  trainingMs: report.trainingMs,
  classifierAccuracy: report.evaluation.exactAccuracy,
  conversionAccuracy: correct / rows.length,
  confusion,
};
await writeFile(
  resolve(root, ".matchbox/shapes/shape-evaluation.json"),
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify(result, null, 2));
model.dispose();
