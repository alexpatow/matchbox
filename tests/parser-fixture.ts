import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";

export function makeParser() {
  return defineParser({
    input: z.string().min(1).max(200),
    output: z.strictObject({
      country: z.enum(["SE", "DE"]),
      minimum: z.number().nonnegative(),
      owner: z.string().nullable().optional(),
    }),
    fields: { minimum: { type: "money", aliases: ["ARR"] } },
  });
}
