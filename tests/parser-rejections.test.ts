import { expect, test } from "bun:test";
import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";

const unsupported = [
  z.string().transform((s) => s.length),
  z.string().trim(),
  z.coerce.number(),
  z.string().refine((s) => s !== "bad"),
  z.string().refine(async () => true),
  z.string().default("hello"),
  z.string().catch("fallback"),
  z.string().prefault("hello"),
  z.date(),
  z.bigint(),
  z.unknown(),
  z.any(),
  z.undefined(),
  z.map(z.string(), z.string()),
  z.set(z.string()),
  z.record(z.string(), z.string()),
  z.tuple([z.string()]),
  z.string().regex(/hello/i),
  z.email(),
  z.string().readonly(),
  z.lazy(() => z.string()),
  z.string().max(Infinity),
  z.number().min(-Infinity),
];

test.each(unsupported)("rejects unsupported nested behavior at definition time (%#)", (schema) => {
  expect(() =>
    defineParser({ input: z.string(), output: z.strictObject({ nested: schema }) }),
  ).toThrow(/output.nested/);
});

test("requires strict objects and structured roots", () => {
  for (const output of [
    z.object({}),
    z.looseObject({}),
    z.string(),
    z.number(),
    z.null(),
    z.union([z.strictObject({}), z.string()]),
  ]) {
    expect(() => defineParser({ input: z.string(), output })).toThrow(/output/);
  }
});

test("only supports optional directly on object properties", () => {
  expect(() => defineParser({ input: z.string(), output: z.array(z.string().optional()) })).toThrow(
    /optional/,
  );
  expect(() =>
    defineParser({
      input: z.string(),
      output: z.strictObject({
        value: z.union([z.string(), z.undefined()]),
      }),
    }),
  ).toThrow(/undefined/);
});

test("rejects custom refinements on containers, even if their children are supported", () => {
  expect(() =>
    defineParser({ input: z.string(), output: z.strictObject({}).superRefine(() => {}) }),
  ).toThrow(/unsupported check/);
});

test("rejects invalid inputs, recursive definitions, and malformed field metadata", () => {
  // @ts-expect-error Exercise the runtime guard for untyped callers too.
  expect(() => defineParser({ input: z.coerce.string(), output: z.strictObject({}) })).toThrow(
    /coercion/,
  );
  const recursive = z.strictObject({
    get children() {
      return z.array(recursive);
    },
  });
  expect(() => defineParser({ input: z.string(), output: recursive })).toThrow(/recursive/);
  expect(() =>
    defineParser({
      input: z.string(),
      output: z.strictObject({}),
      fields: { name: { aliases: [""] } },
    }),
  ).toThrow(/fields/);
});

test("rejects values that JSON conversion or Zod would silently alter", () => {
  for (const output of [
    z.strictObject({ ["__proto__"]: z.string() }),
    z.strictObject({ value: z.enum({ invalid: Infinity }) }),
  ]) {
    expect(() => defineParser({ input: z.string(), output })).toThrow();
  }
});

test("rejects custom conditional guards on otherwise supported checks", () => {
  const input = z.string().min(3);
  const check = input._zod.def.checks?.[0];
  if (!check) {
    throw new Error("Expected the length check.");
  }
  check._zod.def.when = () => false;
  expect(() => defineParser({ input, output: z.strictObject({}) })).toThrow(/conditional/);
});

test("rejects fractional and negative length bounds that are invalid JSON Schema", () => {
  for (const output of [z.array(z.string()).min(1.5), z.array(z.string()).max(-1)]) {
    expect(() => defineParser({ input: z.string(), output })).toThrow(/length bounds/);
  }
});
