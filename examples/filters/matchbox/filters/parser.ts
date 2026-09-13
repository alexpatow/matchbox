import { countryCodes } from "./lib/countries";
import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";
export const clauseSchema = z.union([
  z.strictObject({
    field: z.literal("status"),
    operator: z.enum(["eq", "neq"]),
    value: z.enum(["active", "inactive", "churned"]),
  }),
  z.strictObject({
    field: z.literal("country"),
    operator: z.enum(["eq", "neq"]),
    value: z.enum(countryCodes),
  }),
  z.strictObject({
    field: z.literal("arr"),
    operator: z.enum(["eq", "gt", "gte", "lt", "lte"]),
    value: z.number().nonnegative(),
  }),
]);
const conjunction = z.strictObject({ and: z.array(clauseSchema).min(1).max(8) });
const output = z.union([
  clauseSchema,
  conjunction,
  z.strictObject({
    or: z
      .array(z.union([clauseSchema, conjunction]))
      .min(1)
      .max(8),
  }),
]);
const task = defineParser({
  input: z.string().min(1).max(500),
  output,
  fields: {
    status: { type: "enum" },
    country: { type: "country" },
    arr: { type: "money", aliases: ["ARR", "annual recurring revenue"] },
  },
});
export type Filter = z.infer<typeof output>;
export type Clause = z.infer<typeof clauseSchema>;
export default task;
