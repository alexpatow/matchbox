/** Publish measurements, never checkpoints or source text. */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

interface Metrics {
  accuracy: number;
  styledMacroF1: number;
  confusion: number[][];
  documents: [number, number][];
}
const [localPath, recurrentPath, destination] = process.argv.slice(2);
if (!localPath || !recurrentPath || !destination) {
  throw new Error("Usage: bun summarize.ts <local-run> <recurrent-run> <new-evidence.json>");
}
const read = async (directory: string, name: string) =>
  JSON.parse(await readFile(resolve(directory, `${name}.json`), "utf8"));
const conditions = await Promise.all(
  [localPath, recurrentPath].map(async (directory) => ({
    training: await read(directory, "report"),
    validation: (await read(directory, "validation")) as Metrics,
    test: (await read(directory, "test")) as Metrics,
    confidence: await read(directory, "confidence"),
  })),
);
for (const condition of conditions) {
  if (JSON.stringify(condition.test.confusion) !== JSON.stringify(condition.confidence.confusion)) {
    throw new Error("Saved-checkpoint confidence assessment must reproduce the test predictions.");
  }
  const { revision, ...training } = condition.training;
  condition.training = { ...training, baseRevision: revision };
}
const [local, recurrent] = conditions;
if (JSON.stringify(local!.training.manifest) !== JSON.stringify(recurrent!.training.manifest)) {
  throw new Error("Experiments must use identical feature and dataset manifests.");
}
function compare(first: Metrics, second: Metrics) {
  if (
    first.documents.length !== second.documents.length ||
    first.documents.some((row, i) => row[1] !== second.documents[i]![1])
  ) {
    throw new Error("Document counts differ.");
  }
  let seed = 4231;
  const differences = Array.from({ length: 2000 }, () => {
    let correct = 0;
    let support = 0;
    for (let i = 0; i < first.documents.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const index = Math.floor((seed / 4294967296) * first.documents.length);
      correct += second.documents[index]![0] - first.documents[index]![0];
      support += first.documents[index]![1];
    }
    return correct / support;
  }).sort((a, b) => a - b);
  return {
    accuracyDifference: second.accuracy - first.accuracy,
    pairedDocumentBootstrap: {
      samples: 2000,
      seed: 4231,
      confidence: 0.95,
      lower: differences[49],
      upper: differences[1949],
    },
    limitation:
      "Document sampling uncertainty only; does not capture seed variation or checkpoint-selection bias.",
  };
}
const evidence = {
  task: "Nine-label lexical classification over mechanical parts",
  researchOnly: true,
  conditions,
  validationComparison: compare(local!.validation, recurrent!.validation),
  testComparison: compare(local!.test, recurrent!.test),
  limits: [
    "Native prototype only; no public parser acceptance, packaged browser artifact, or WASM parity claim.",
    "Both candidates ran concurrently on one development machine; timings are not isolated speed comparisons.",
    "Same fixed corpus as the character experiment, but representation, loss supervision, capacity, and training budget changed.",
    "The candidates omit gpu-lexer's tree hierarchy, auxiliary supervision, quantization-aware training, and pretrained checkpoint.",
    "Per-part confidence uses a fixed 0.75 threshold and remains uncalibrated.",
    "This benchmark has been reported in prior iterations; final generalization claims need a fresh repository-disjoint holdout.",
  ],
};
await writeFile(destination, JSON.stringify(evidence, null, 2), { flag: "wx" });
