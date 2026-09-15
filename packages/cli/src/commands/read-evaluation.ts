import type { ParserDefinition } from "@matchbox-ai/core";
import { z } from "zod";
export function readEvaluation(text: string, source: string, task: ParserDefinition<z.ZodType>) {
  const rows: { input: string; output: unknown }[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) {
      return;
    }
    try {
      const row = z
        .strictObject({ input: z.string(), output: z.unknown() })
        .parse(JSON.parse(line));
      if (!Object.hasOwn(row, "output")) {
        throw new Error("output: required");
      }
      const input = task.validateInput(row.input);
      const output = task.validateOutput(row.output);
      if (!input.success) {
        throw new Error(
          input.issues.map((issue) => `input.${issue.path.join(".")}: ${issue.message}`).join("; "),
        );
      }
      if (!output.success) {
        throw new Error(
          output.issues
            .map((issue) => `output.${issue.path.join(".")}: ${issue.message}`)
            .join("; "),
        );
      }
      rows.push({ input: input.data, output: output.data });
    } catch (error) {
      throw new Error(
        `${source}:${index + 1}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });
  if (!rows.length) {
    throw new Error(`${source}:1: Evaluation data must contain at least one example.`);
  }
  return rows;
}
