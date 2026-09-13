import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { parseDatasets } from "../dataset/index.js";
import type { ParserDefinition } from "../parser/index.js";
import type { MatchboxParser } from "../runtime/index.js";
const configSchema = z.strictObject({
  formatVersion: z.literal(1),
  task: z.string(),
  baseline: z.string(),
  train: z.string(),
  validation: z.string(),
  eval: z.string(),
  output: z.string(),
  minAccuracy: z.number().min(0).max(1),
  maxBytes: z.number().positive(),
});
export async function loadProject(path: string) {
  const root = dirname(resolve(path));
  const config = configSchema.parse((await import(pathToFileURL(resolve(path)).href)).default);
  const taskPath = resolve(root, config.task);
  const task: ParserDefinition<z.ZodType> = (await import(pathToFileURL(taskPath).href)).default;
  const baseline: MatchboxParser<unknown> = (
    await import(pathToFileURL(resolve(root, config.baseline)).href)
  ).default;
  const sources = await Promise.all(
    [config.train, config.validation, config.eval].map(async (source) => ({
      source,
      text: await readFile(resolve(root, source), "utf8"),
    })),
  );
  const training = parseDatasets(task, { formatVersion: 1, train: sources[0]!, eval: sources[1]! });
  const evaluation = parseDatasets(task, {
    formatVersion: 1,
    train: sources[0]!,
    eval: sources[2]!,
  });
  for (const result of [training, evaluation])
    if (!result.success)
      throw new Error(
        result.issues
          .map((issue) => `${issue.source}:${issue.line} ${issue.path.join(".")}: ${issue.message}`)
          .join("\n"),
      );
  if (!training.success || !evaluation.success) throw new Error("Invalid datasets.");
  const groups = [training.data.train, training.data.eval, evaluation.data.eval];
  const seen = new Map<string, number>();
  groups.forEach((group, split) =>
    group.forEach((row) => {
      const key = row.input.trim().toLowerCase();
      if (seen.has(key) && seen.get(key) !== split)
        throw new Error(`Input overlaps dataset splits: ${row.input}`);
      seen.set(key, split);
    }),
  );
  return {
    config,
    task,
    baseline,
    taskPath,
    output: resolve(root, config.output),
    sources,
    train: training.data.train,
    validation: training.data.eval,
    evaluation: evaluation.data.eval,
  };
}
