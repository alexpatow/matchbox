import type { z } from "zod";
import type { ParserDefinition } from "../parser/index.js";
import { parseSource } from "./parse-source.js";
import type { DatasetConfig, DatasetIssue, DatasetResult } from "./types.js";

/** Validate both splits without shuffling, splitting, or returning partial data. */
export function parseDatasets<Output extends z.ZodType>(
  task: ParserDefinition<Output>,
  config: DatasetConfig,
): DatasetResult<z.output<Output>> {
  if (config.formatVersion !== 1)
    throw new RangeError("Unsupported dataset formatVersion. Expected 1.");
  const issues: DatasetIssue[] = [];
  const train = parseSource(task, config.train, "train", issues);
  const evaluation = parseSource(task, config.eval, "eval", issues);
  return issues.length > 0
    ? { success: false, issues }
    : { success: true, data: { train, eval: evaluation } };
}
