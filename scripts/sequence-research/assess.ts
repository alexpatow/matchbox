/** Re-evaluate saved weights without fitting. Test evaluation must follow model selection. */
import { readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { createParser } from "@matchbox-ai/core/runtime";
import { readSequenceArtifact, tensorPredictor, windows } from "@matchbox-ai/core/internal";
import type { DatasetExample } from "@matchbox-ai/core";
import type { SequenceRecipe } from "../../packages/train/src/models/sequence/types.js";
import { predict } from "../../packages/train/src/native/fit.js";
import { sequenceParity } from "../../packages/train/src/models/sequence/export-parity.js";
import { sameOutput } from "../../packages/train/src/evaluation/same-output.js";
import { measure } from "./metrics.js";

const [taskPath, modelPath, validationPath, outputPath, split = "validation"] =
  process.argv.slice(2);
if (!taskPath || !modelPath || !validationPath || !outputPath) {
  throw new Error(
    "Usage: bun scripts/sequence-research/assess.ts <task> <model> <split.jsonl> <new-report.json> [validation|test]",
  );
}
if (!["validation", "test"].includes(split) || basename(validationPath) !== `${split}.jsonl`) {
  throw new Error("The evaluation filename must match the declared split.");
}
const serialized = await readFile(modelPath, "utf8");
const model = readSequenceArtifact(JSON.parse(serialized));
const source = await readFile(validationPath, "utf8");
const rows: DatasetExample<unknown>[] = source
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));
const recipe: SequenceRecipe = {
  ...(await import(pathToFileURL(resolve(taskPath, "recipe.ts")).href)).default,
  casing: model.casing ?? "lowercase",
};
const task = (await import(pathToFileURL(resolve(taskPath, "parser.ts")).href)).default;
const decode = (await import(pathToFileURL(resolve(taskPath, "decode.ts")).href)).default;
const parser = createParser(model, task, decode);
const portable = await tensorPredictor(model);
const parity = sequenceParity(model.threshold);
const weights = Buffer.from(model.weights, "base64");
let accepted = 0;
let exact = 0;
const reasons: Record<string, number> = {};
try {
  for (const row of rows) {
    const result = await parser.parse(row.input);
    if (result.status === "ok") {
      accepted++;
      exact += Number(sameOutput(result.value, row.output));
    } else {
      reasons[result.reason!] = (reasons[result.reason!] ?? 0) + 1;
    }
    const tokens = portable.sequence(row.input);
    if (!tokens.length) {
      continue;
    }
    const scores = predict(
      {
        vocabularySize: model.vocabulary.length + 2,
        labelCount: model.labels.length,
        contextRadius: model.radius,
      },
      weights,
      windows(tokens, model.vocabulary, model.radius),
    );
    for (const [index, token] of tokens.entries()) {
      const scoresForToken = scores.slice(
        index * model.labels.length,
        (index + 1) * model.labels.length,
      );
      const confidence = Math.max(...scoresForToken);
      parity.add({ label: model.labels[scoresForToken.indexOf(confidence)]!, confidence }, token);
    }
  }
} finally {
  parser.dispose();
  portable.dispose();
}
let exportParity;
try {
  exportParity = { passed: true, ...parity.report() };
} catch (error) {
  exportParity = { passed: false, error: String(error) };
  process.exitCode = 1;
}
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
await writeFile(
  outputPath,
  JSON.stringify(
    {
      researchOnly: true,
      split,
      artifactSha256: hash(serialized),
      datasetSha256: hash(source),
      casing: model.casing ?? "lowercase",
      contextRadius: model.radius,
      diagnostic: await measure(model, recipe, rows),
      application: {
        examples: rows.length,
        accepted,
        abstained: rows.length - accepted,
        exactMatches: exact,
        exactAccuracy: exact / rows.length,
        reasons,
      },
      exportParity,
    },
    null,
    2,
  ),
  { flag: "wx" },
);
