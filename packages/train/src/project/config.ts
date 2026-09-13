import { access, stat } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { pipelineSchema } from "../pipeline/index.js";
export const configSchema = z.strictObject({
  formatVersion: z.literal(1).default(1),
  task: z.string().default("./parser.ts"),
  train: z.string().default("./data/train.jsonl"),
  validation: z.string().default("./evals/validation.jsonl"),
  eval: z.string().default("./evals/test.jsonl"),
  output: z.string().endsWith(".matchbox"),
  minAccuracy: z.number().min(0).max(1).default(0.95),
  maxBytes: z.number().positive().default(64000),
  sequence: z.strictObject({ recipe: z.string(), decoder: z.string() }).optional(),
  baseline: z.string().optional(),
  challenges: z.string().optional(),
});
export async function loadConfig(path: string) {
  const directory = (await stat(path)).isDirectory();
  const root = directory ? resolve(path) : dirname(resolve(path));
  const exists = (file: string) =>
    access(resolve(root, file)).then(
      () => true,
      () => false,
    );
  const configPath = directory ? resolve(root, "matchbox.config.ts") : resolve(path);
  const authored = await access(configPath).then(
    async () => (await import(pathToFileURL(configPath).href)).default,
    () => ({}),
  );
  let defaults: Record<string, unknown> = {};
  if (await exists("pipeline.ts")) {
    const pipeline = pipelineSchema.parse(
      (await import(pathToFileURL(resolve(root, "pipeline.ts")).href)).default,
    );
    defaults = { ...pipeline.acceptance };
    if (pipeline.prediction.kind === "token-classifier")
      defaults.sequence = {
        recipe: pipeline.prediction.recipe,
        decoder: pipeline.prediction.decode,
      };
  } else if (!authored.sequence)
    throw new Error(
      `Missing ${resolve(root, "pipeline.ts")}. Author an explicit pipeline before training.`,
    );
  const config = configSchema.parse({
    output: resolve(root, "../../.matchbox", basename(root), "model.matchbox"),
    ...defaults,
    ...authored,
  });
  if (!config.baseline && (await exists("evals/baseline.ts")))
    config.baseline = "./evals/baseline.ts";
  if (!config.challenges && (await exists("evals/challenges.json")))
    config.challenges = "./evals/challenges.json";
  return { config, root };
}
