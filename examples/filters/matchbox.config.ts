import type { TrainingConfig } from "@matchbox-ai/train";
export default {
  formatVersion: 1,
  sequence: { recipe: "./recipe.ts", decoder: "./src/filter/decode.ts" },
  task: "./src/filter/task.ts",
  baseline: "./src/filter/baseline.ts",
  train: "./data/train.jsonl",
  validation: "./data/validation.jsonl",
  eval: "./data/evals.jsonl",
  output: "./src/generated/filters.matchbox",
  minAccuracy: 0.95,
  maxBytes: 64000,
} satisfies TrainingConfig;
