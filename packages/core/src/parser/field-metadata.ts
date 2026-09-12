import { z } from "zod";
import { jsonIssue } from "./json-value.js";
import type { FieldMetadata } from "./types.js";

const metadataSchema = z.record(
  z.string().min(1),
  z.strictObject({
    type: z.string().min(1).optional(),
    aliases: z.array(z.string().min(1)).optional(),
    description: z.string().optional(),
  }),
);

export function readFields(value: unknown): Readonly<Record<string, FieldMetadata>> {
  const input = value === undefined ? {} : value;
  const issue = jsonIssue(input);
  if (issue) throw new TypeError(`fields.${issue.path.join(".")}: ${issue.message}`);
  const fields = metadataSchema.safeParse(input, { jitless: true });
  if (!fields.success) throw new TypeError(`fields: ${fields.error.message}`);
  return Object.fromEntries(
    Object.entries(fields.data).map(([name, field]) => [
      name,
      {
        ...(field.type === undefined ? {} : { type: field.type }),
        ...(field.aliases === undefined ? {} : { aliases: field.aliases }),
        ...(field.description === undefined ? {} : { description: field.description }),
      },
    ]),
  );
}
