import { access, stat } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { findEntry, resolveModule } from "./entry.js";
import { pipelineSchema } from "../pipeline/index.js";
export const configSchema = z.strictObject({
  task: z.string().default("./parser"),
  train: z.string().default("./data/train.jsonl"),
  validation: z.string().default("./evals/validation.jsonl"),
  eval: z.string().default("./evals/test.jsonl"),
  output: z.string().endsWith(".matchbox"),
  minAccuracy: z.number().min(0).max(1).default(0.95),
  maxBytes: z.number().positive().default(64000),
  sequence: z
    .strictObject({
      recipe: z.string(),
      decoder: z.string(),
      contextRadius: z.number().int().min(1).max(16).optional(),
      recurrent: z
        .strictObject({
          epochs: z.number().int().min(1).max(100),
          learningRate: z.number().positive().max(0.1),
          batchParts: z.number().int().min(128).max(16384),
          maxInputLength: z.number().int().min(1).max(1_000_000),
          maxParts: z.number().int().min(1).max(65536),
        })
        .optional(),
    })
    .optional(),
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
  const pipelinePath = await findEntry(root, "pipeline");
  if (pipelinePath) {
    const pipeline = pipelineSchema.parse((await import(pathToFileURL(pipelinePath).href)).default);
    defaults = { ...pipeline.acceptance };
    if (pipeline.prediction.kind === "recurrent-token-classifier") {
      const { recipe, decode, kind: _kind, ...recurrent } = pipeline.prediction;
      defaults.sequence = { recipe, decoder: decode, recurrent };
      defaults.maxBytes ??= 256_000;
    }
    if (pipeline.prediction.kind === "token-classifier") {
      defaults.sequence = {
        recipe: pipeline.prediction.recipe,
        decoder: pipeline.prediction.decode,
        contextRadius: pipeline.prediction.contextRadius,
      };
    }
  } else if (!authored.sequence) {
    throw new Error(
      `Missing pipeline.ts or pipeline/pipeline.ts in ${root}. Author an explicit pipeline before training.`,
    );
  }
  const config = configSchema.parse({
    output: resolve(root, "../../.matchbox", basename(root), "model.matchbox"),
    ...defaults,
    ...authored,
  });
  if (!config.challenges && (await exists("evals/challenges.json"))) {
    config.challenges = "./evals/challenges.json";
  }
  config.task = await resolveModule(root, config.task);
  if (config.sequence) {
    config.sequence.recipe = await resolveModule(root, config.sequence.recipe);
    config.sequence.decoder = await resolveModule(root, config.sequence.decoder);
  }
  return { config, root, pipelinePath };
}
