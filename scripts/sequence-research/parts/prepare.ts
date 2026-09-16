/** Research adapter for the pinned gpu-lexer mechanical feature encoder. */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, open, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { partTargets, type LabeledSpan } from "./targets.js";

const [upstreamPath, corpusPath, outputPath] = process.argv.slice(2);
if (!upstreamPath || !corpusPath || !outputPath) {
  throw new Error("Usage: bun prepare.ts <pinned-gpu-lexer-checkout> <corpus> <new-output>");
}
const revision = execFileSync("git", ["-C", upstreamPath, "rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
if (revision !== "1e514fd681e31d6b19296f985fb01d8fdc0ae74f") {
  throw new Error("Use the corpus-pinned gpu-lexer revision.");
}
execFileSync(
  "git",
  [
    "-C",
    upstreamPath,
    "diff",
    "--exit-code",
    "HEAD",
    "--",
    "packages/core/src/prepare-tree.js",
    "packages/core/src/tree-features.js",
    "packages/core/src/constants.js",
  ],
  { stdio: "pipe" },
);
const moduleUrl = (name: string) =>
  pathToFileURL(resolve(upstreamPath, `packages/core/src/${name}.js`)).href;
const { prepareTreeSource, releaseTreePrepared } = await import(moduleUrl("prepare-tree"));
const { treeFeatureIndices, treeFeatureLayout } = await import(moduleUrl("tree-features"));
const layout = treeFeatureLayout();
const labels = [
  "plain",
  "comment",
  "string",
  "number",
  "keyword",
  "type",
  "function",
  "constant",
  "operator",
];
await mkdir(outputPath); // Never overwrite an experiment's inputs.
const splits = [];
for (const split of ["train", "validation", "test"]) {
  const source = await readFile(resolve(corpusPath, `${split}.jsonl`), "utf8");
  const file = await open(resolve(outputPath, `${split}.jsonl`), "wx");
  let records = 0;
  let parts = 0;
  let characters = 0;
  let maxParts = 0;
  try {
    for (const line of source.trim().split("\n")) {
      const row = JSON.parse(line) as {
        input: string;
        output: LabeledSpan[];
      };
      const prepared = prepareTreeSource(row.input);
      const [data, ranges, , count] = prepared;
      const features: number[][] = [];
      const targets = partTargets(row.input, row.output, ranges, labels);
      characters += targets.reduce(
        (sum, counts) => sum + counts.reduce((n, count) => n + count, 0),
        0,
      );
      for (let index = 0; index < count; index++) {
        // Exclude upstream's hand-authored pairCode categories. Keep generic hashes.
        const ids = (treeFeatureIndices(data, index) as number[]).filter(
          (id) => id < layout.previousPair || id >= layout.previousSymbolPair,
        );
        features.push(ids.map((id) => id + 1)); // Zero is padding, never a feature.
      }
      releaseTreePrepared(prepared);
      await file.write(`${JSON.stringify({ features, targets })}\n`);
      records++;
      parts += count;
      maxParts = Math.max(maxParts, count);
    }
  } finally {
    await file.close();
  }
  splits.push({
    split,
    sha256: createHash("sha256").update(source).digest("hex"),
    records,
    parts,
    characters,
    maxParts,
  });
}
await writeFile(
  resolve(outputPath, "manifest.json"),
  JSON.stringify(
    {
      upstreamRevision: revision,
      featureCount: layout.inputSize + 1,
      labels,
      encoding: "gpu-lexer-v3 mechanical parts, excluding pairCode feature rows",
      supervision:
        "non-whitespace Unicode code-point counts per label per part; whitespace is context-only",
      splits,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(splits));
