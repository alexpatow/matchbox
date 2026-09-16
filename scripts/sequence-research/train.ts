/** Framework research, using local builds. Never substitutes for a published consumer test. */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cpus, totalmem } from "node:os";
import type { DatasetExample } from "@matchbox-ai/core";
import type { SequenceArtifact } from "@matchbox-ai/core/internal";
import type { SequenceRecipe } from "../../packages/train/src/models/sequence/types.js";
import { prepareSupervision } from "../../packages/train/src/models/sequence/prepare-supervision.js";
import { fit } from "../../packages/train/src/native/fit.js";
import { measure } from "./metrics.js";

const [taskPath, corpusPath, outputPath, casing, radiusText] = process.argv.slice(2);
if (!taskPath || !corpusPath || !outputPath || !["preserve", "lowercase"].includes(casing ?? "")) {
  throw new Error(
    "Usage: bun scripts/sequence-research/train.ts <task> <corpus> <new-output> <preserve|lowercase> <radius>",
  );
}
const radius = Number(radiusText);
const output = resolve(outputPath);
await mkdir(output); // Refuse to overwrite an earlier experiment.
const startedAt = new Date().toISOString();
const start = performance.now();
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const sources = await Promise.all(
  ["train", "validation"].map(async (split) => {
    const text = await readFile(resolve(corpusPath, `${split}.jsonl`), "utf8");
    return {
      split,
      sha256: hash(text),
      rows: text
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line)) as DatasetExample<unknown>[],
    };
  }),
);
const recipe: SequenceRecipe = {
  ...(await import(pathToFileURL(resolve(taskPath, "recipe.ts")).href)).default,
  casing,
};
const task = (await import(pathToFileURL(resolve(taskPath, "parser.ts")).href)).default;
const prepared = prepareSupervision(sources[0]!.rows, recipe, radius);
const preparationMs = performance.now() - start;
const fitStart = performance.now();
const trained = await fit(
  {
    vocabularySize: prepared.vocabulary.length + 2,
    labelCount: recipe.labels.length,
    contextRadius: radius,
  },
  prepared.inputs,
  prepared.labels,
  (epoch, loss) => console.log(JSON.stringify({ epoch, loss })),
);
const fitMs = performance.now() - fitStart;
const model: SequenceArtifact = {
  formatVersion: 4,
  engine: "burn-0.21",
  kind: "sequence-parser",
  architecture: "embedding-window-mlp",
  taskModule: "./parser.ts",
  decoderModule: "./decode.ts",
  taskMetadata: task.toJSON(),
  tokenizer: recipe.tokenizer,
  casing: recipe.casing!,
  readout: recipe.readout,
  vocabulary: prepared.vocabulary,
  labels: [...recipe.labels],
  radius,
  unknownTokens: prepared.dropout > 0 ? "predict" : "abstain",
  threshold: 0.75,
  precision: "float32",
  weights: Buffer.from(trained.weights).toString("base64"),
};
const serialized = JSON.stringify(model);
await writeFile(resolve(output, "model.json"), serialized);
const report = {
  researchOnly: true,
  runtime: "local Burn native training / WASM evaluation",
  startedAt,
  revision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  diffSha256: hash(execFileSync("git", ["diff", "HEAD"], { encoding: "utf8" })),
  casing,
  contextRadius: radius,
  seed: 42,
  epochs: 55,
  learningRate: 0.005,
  batchSize: 128,
  machine: {
    platform: process.platform,
    arch: process.arch,
    cpu: cpus()[0]?.model,
    memoryBytes: totalmem(),
  },
  datasets: sources.map(({ split, sha256, rows }) => ({ split, sha256, records: rows.length })),
  supervisedTokens: prepared.labels.length,
  vocabulary: prepared.vocabulary.length,
  artifactSha256: hash(serialized),
  bytes: Buffer.byteLength(serialized),
  parameters: trained.parameters,
  preparationMs,
  fitMs,
  loss: trained.loss,
};
await writeFile(resolve(output, "fit.json"), JSON.stringify(report, null, 2));
const validation = await measure(model, recipe, sources[1]!.rows);
await writeFile(
  resolve(output, "report.json"),
  JSON.stringify({ ...report, validation, wallMs: performance.now() - start }, null, 2),
);
console.log(
  JSON.stringify({ casing, radius, validation: validation.accuracy, fitMs, bytes: report.bytes }),
);
