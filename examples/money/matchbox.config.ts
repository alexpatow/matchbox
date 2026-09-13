import type { TrainingConfig } from "@matchbox-ai/train";
export default {
  formatVersion: 1,
  task: "./src/task.ts",
  challenges: "./data/challenges.json",
  baseline: "./baseline.ts",
  sequence: {
    recipe: "./recipe.ts",
    decoder: "./src/decode.ts",
  },
  train: "./data/train.jsonl",
  validation: "./data/validation.jsonl",
  eval: "./data/evals.jsonl",
  output: "./src/generated/money.matchbox",
  minAccuracy: 0.85,
  maxBytes: 24000,
} satisfies TrainingConfig;
