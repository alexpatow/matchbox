/** Paired document bootstrap; characters within a document are not independent trials. */
import { readFile, writeFile } from "node:fs/promises";
interface Assessment {
  artifactSha256: string;
  datasetSha256: string;
  diagnostic: {
    accuracy: number;
    documents: { correct: number; tokens: number }[];
  };
}
const [baselinePath, candidatePath, outputPath] = process.argv.slice(2);
if (!baselinePath || !candidatePath || !outputPath) {
  throw new Error(
    "Usage: bun scripts/sequence-research/compare.ts <baseline-assessment> <candidate-assessment> <new-report.json>",
  );
}
const baseline: Assessment = JSON.parse(await readFile(baselinePath, "utf8"));
const candidate: Assessment = JSON.parse(await readFile(candidatePath, "utf8"));
const first = baseline.diagnostic.documents;
const second = candidate.diagnostic.documents;
if (
  baseline.datasetSha256 !== candidate.datasetSha256 ||
  first.length !== second.length ||
  first.some((row, index) => row.tokens !== second[index]!.tokens)
) {
  throw new Error("Paired comparisons require the same documents and scored token counts.");
}
let seed = 4231;
const differences = Array.from({ length: 2000 }, () => {
  let delta = 0;
  let tokens = 0;
  for (let count = 0; count < first.length; count++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const index = Math.floor((seed / 4294967296) * first.length);
    delta += second[index]!.correct - first[index]!.correct;
    tokens += first[index]!.tokens;
  }
  return tokens ? delta / tokens : 0;
}).sort((a, b) => a - b);
await writeFile(
  outputPath,
  JSON.stringify(
    {
      datasetSha256: baseline.datasetSha256,
      baselineArtifactSha256: baseline.artifactSha256,
      candidateArtifactSha256: candidate.artifactSha256,
      accuracyDifference: candidate.diagnostic.accuracy - baseline.diagnostic.accuracy,
      pairedDocumentBootstrap: {
        samples: 2000,
        seed: 4231,
        confidence: 0.95,
        lower: differences[49],
        upper: differences[1949],
      },
      limitation:
        "Sampling uncertainty over validation documents only. Does not measure seed-to-seed training variation or correct for repeated model selection.",
    },
    null,
    2,
  ),
  { flag: "wx" },
);
