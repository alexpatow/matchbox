import { access, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
export const configSchema = z.strictObject({
  formatVersion: z.literal(1).default(1),
  task: z.string().default("./parser/parser.ts"),
  train: z.string().default("./parser/data/train.jsonl"),
  validation: z.string().default("./evals/validation.jsonl"),
  eval: z.string().default("./evals/evals.jsonl"),
  output: z.string().endsWith(".matchbox").default("./.matchbox/parser.matchbox"),
  minAccuracy: z.number().min(0).max(1).default(0.95),
  maxBytes: z.number().positive().default(64000),
  sequence: z.strictObject({ recipe: z.string(), decoder: z.string() }).optional(),
  baseline: z.string().optional(),
  challenges: z.string().optional(),
});
export async function loadConfig(path: string) {
  const directory = (await stat(path)).isDirectory();
  const root = directory ? resolve(path) : dirname(resolve(path));
  const configPath = directory ? resolve(root, "matchbox.config.ts") : resolve(path);
  const hasConfig =
    !directory ||
    (await access(configPath).then(
      () => true,
      () => false,
    ));
  const authored = hasConfig ? (await import(pathToFileURL(configPath).href)).default : {};
  const config = configSchema.parse(authored);
  const exists = (file: string) =>
    access(resolve(root, file)).then(
      () => true,
      () => false,
    );
  if (!config.sequence) {
    const recipe = await exists("parser/recipe.ts"),
      decoder = await exists("parser/decode.ts");
    if (recipe !== decoder)
      throw new Error(
        "An explicit pipeline requires both parser/recipe.ts and parser/decode.ts. Add the missing file or remove the pipeline override.",
      );
    if (recipe) config.sequence = { recipe: "./parser/recipe.ts", decoder: "./parser/decode.ts" };
  }
  if (!config.baseline && (await exists("evals/baseline.ts")))
    config.baseline = "./evals/baseline.ts";
  if (!config.challenges && (await exists("evals/challenges.json")))
    config.challenges = "./evals/challenges.json";
  return { config, root };
}
