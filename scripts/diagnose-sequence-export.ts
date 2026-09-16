/** Framework research only. This bypasses public orchestration and never publishes a model. */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { z } from "zod";
import type { DatasetExample, ParserDefinition } from "@matchbox-ai/core";
import type { SequenceArtifact } from "@matchbox-ai/core/internal";
import type { SequenceRecipe } from "../packages/train/src/models/sequence/types.js";
import { prepareSupervision } from "../packages/train/src/models/sequence/prepare-supervision.js";

type Config = { vocabularySize: number; labelCount: number };
interface Native {
  fit(
    config: string,
    inputs: Int32Array,
    labels: Int32Array,
    progress: (error: Error | null, values: number[]) => void,
  ): Promise<{ weights: Uint8Array; parameters: number; loss: number[] }>;
  predict(config: string, weights: Buffer, inputs: Int32Array): number[];
}
const [consumer, taskPath, corpusPath, outputPath, limit] = process.argv.slice(2);
if (!consumer || !taskPath || !corpusPath || !outputPath) {
  throw new Error(
    "Usage: bun scripts/diagnose-sequence-export.ts <consumer> <task> <corpus> <new-output-directory> [record-limit]",
  );
}
const output = resolve(outputPath);
try {
  await access(output);
  throw new Error(`Refusing to overwrite ${output}`);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
    throw error;
  }
}
const rows = async (name: string): Promise<DatasetExample<unknown>[]> =>
  (await readFile(resolve(corpusPath, `${name}.jsonl`), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
const train = (await rows("train")).slice(0, limit ? Number(limit) : undefined);
const validation = await rows("validation");
const recipe: SequenceRecipe = (await import(pathToFileURL(resolve(taskPath, "recipe.ts")).href))
  .default;
const task: ParserDefinition<z.ZodType> = (
  await import(pathToFileURL(resolve(taskPath, "parser.ts")).href)
).default;
const require = createRequire(resolve(consumer, "node_modules/@matchbox-ai/train/package.json"));
const native = require("#native") as Native;
const coreRoot = resolve(consumer, "node_modules/@matchbox-ai/core");
const coreManifest = JSON.parse(await readFile(resolve(coreRoot, "package.json"), "utf8"));
const core: typeof import("@matchbox-ai/core/internal") = await import(
  pathToFileURL(resolve(coreRoot, coreManifest.exports["./internal"].import)).href
);
const versions = await Promise.all(
  ["@matchbox-ai/core", "@matchbox-ai/train"].map(async (name) => {
    const manifest = JSON.parse(
      await readFile(resolve(consumer, "node_modules", name, "package.json"), "utf8"),
    );
    return [name, manifest.version];
  }),
);
const { vocabulary, inputs, labels, radius, dropout } = prepareSupervision(train, recipe);
const config: Config = { vocabularySize: vocabulary.length + 2, labelCount: recipe.labels.length };
await mkdir(output, { recursive: true });
const start = performance.now();
const fit = await native.fit(JSON.stringify(config), inputs, labels, (error, values) => {
  if (error) {
    console.error(error);
    return;
  }
  console.log(JSON.stringify({ epoch: values[0], loss: values[1] }));
});
const fitMs = performance.now() - start;
const model: SequenceArtifact = {
  ...(recipe.casing === "preserve"
    ? { formatVersion: 4 as const, casing: "preserve" as const }
    : { formatVersion: 3 as const }),
  engine: "burn-0.21",
  kind: "sequence-parser",
  architecture: "embedding-window-mlp",
  taskModule: "./parser.ts",
  decoderModule: "./decode.ts",
  taskMetadata: task.toJSON(),
  tokenizer: recipe.tokenizer,
  readout: recipe.readout,
  vocabulary,
  labels: [...recipe.labels],
  radius: radius as 1,
  unknownTokens: dropout > 0 ? "predict" : "abstain",
  threshold: 0.75,
  precision: "float32",
  weights: Buffer.from(fit.weights).toString("base64"),
};
await writeFile(resolve(output, "model.json"), JSON.stringify(model));
await writeFile(
  resolve(output, "fit.json"),
  JSON.stringify({
    diagnosticOnly: true,
    packages: Object.fromEntries(versions),
    fitMs,
    parameters: fit.parameters,
    loss: fit.loss,
    supervisedTokens: labels.length,
  }),
);
const portable = await core.tensorPredictor(model);
let maxConfidenceError = 0,
  labelDisagreements = 0,
  tokensChecked = 0;
const mismatches: unknown[] = [];
try {
  for (const [probe, example] of [...train.slice(0, 16), ...validation].entries()) {
    const tokens = core.tokenize(example.input, recipe.tokenizer, recipe.casing);
    if (!tokens.length) {
      continue;
    }
    const scores = native.predict(
      JSON.stringify(config),
      Buffer.from(fit.weights),
      Int32Array.from(core.windows(tokens, vocabulary, radius).flat()),
    );
    portable.sequence(example.input).forEach((token, index) => {
      const row = scores.slice(index * recipe.labels.length, (index + 1) * recipe.labels.length);
      const confidence = Math.max(...row);
      const label = recipe.labels[row.indexOf(confidence)];
      const error = Math.abs(confidence - token.confidence);
      maxConfidenceError = Math.max(maxConfidenceError, error);
      tokensChecked++;
      if (label !== token.label) {
        labelDisagreements++;
      }
      if ((error > 1e-5 || label !== token.label) && mismatches.length < 20) {
        mismatches.push({
          probe,
          index,
          native: { label, confidence, scores: row },
          wasm: { label: token.label, confidence: token.confidence },
          error,
        });
      }
    });
  }
} finally {
  portable.dispose();
}
const report = {
  diagnosticOnly: true,
  trainingRecords: train.length,
  supervisedTokens: labels.length,
  vocabulary: vocabulary.length,
  packages: Object.fromEntries(versions),
  fitMs,
  wallMs: performance.now() - start,
  tokensChecked,
  maxConfidenceError,
  labelDisagreements,
  mismatches,
};
await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
