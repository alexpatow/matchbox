import type { z } from "zod";
import type { ParserDefinition, ValidationIssue } from "../parser/index.js";
import type { DatasetExample, DatasetIssue, DatasetSource } from "./types.js";

export function parseSource<Output extends z.ZodType, Input extends z.ZodType = z.ZodString>(
  task: ParserDefinition<Output, Input>,
  source: DatasetSource,
  split: "train" | "eval",
  issues: DatasetIssue[],
): DatasetExample<z.output<Output>, z.output<Input>>[] {
  const examples: DatasetExample<z.output<Output>, z.output<Input>>[] = [];
  let rows = 0;
  for (const [index, text] of source.text.split(/\r?\n/).entries()) {
    if (text.trim() === "") {
      continue;
    }
    rows++;
    const report = (issue: ValidationIssue) =>
      issues.push({ ...issue, source: source.source, split, line: index + 1 });
    let row: unknown;
    try {
      row = JSON.parse(text);
    } catch {
      report({
        code: "invalid_json",
        path: [],
        message: "Expected one complete JSON value on this line.",
      });
      continue;
    }
    if (
      row === null ||
      typeof row !== "object" ||
      Array.isArray(row) ||
      !Object.hasOwn(row, "input") ||
      !Object.hasOwn(row, "output") ||
      Object.keys(row).length !== 2
    ) {
      report({
        code: "invalid_example",
        path: [],
        message: "Expected an object with exactly input and output properties.",
      });
      continue;
    }
    const example = row as { input: unknown; output: unknown };
    const input = task.validateInput(example.input);
    const output = task.validateOutput(example.output);
    if (!input.success) {
      for (const issue of input.issues) {
        report({ ...issue, path: ["input", ...issue.path] });
      }
    }
    if (!output.success) {
      for (const issue of output.issues) {
        report({ ...issue, path: ["output", ...issue.path] });
      }
    }
    if (input.success && output.success) {
      examples.push({ input: input.data, output: output.data });
    }
  }
  if (rows === 0) {
    issues.push({
      code: "empty_dataset",
      path: [],
      message: "Expected at least one example.",
      source: source.source,
      split,
      line: 1,
    });
  }
  return examples;
}
