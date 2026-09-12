import type { z } from "zod";
import { jsonIssue } from "./json-value.js";
import type { ValidationResult } from "./types.js";

export function validate<Schema extends z.ZodType>(
  schema: Schema,
  value: unknown,
): ValidationResult<z.output<Schema>> {
  const issue = jsonIssue(value);
  if (issue) return { success: false, issues: [issue] };
  const result = schema.safeParse(value, { jitless: true });
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    issues: result.error.issues.map(({ code, path, message }) => ({
      code,
      path: path.map((part) => (typeof part === "symbol" ? String(part) : part)),
      message,
    })),
  };
}
