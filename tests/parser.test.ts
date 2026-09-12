import { expect, test } from "bun:test";
import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";
import { makeParser } from "./parser-fixture";

test("validates explicit string inputs without coercion", () => {
  const task = makeParser();
  expect(task.kind).toBe("parser");
  expect(task.validateInput("Swedish customers")).toEqual({
    success: true,
    data: "Swedish customers",
  });
  for (const input of ["", 42, null, "a".repeat(201)])
    expect(task.validateInput(input).success).toBe(false);
});

test("returns typed validated outputs and rejects unknown properties", () => {
  const task = makeParser();
  const data = { country: "SE", minimum: 50000, owner: null } as const;
  expect(task.validateOutput(data)).toEqual({ success: true, data });
  for (const value of [
    { country: "XX", minimum: 1 },
    { country: "SE", minimum: -1 },
    { country: "SE", minimum: "50000" },
    { country: "SE" },
    { country: "SE", minimum: 1, unexpected: true },
  ])
    expect(task.validateOutput(value).success).toBe(false);
  const failed = task.validateOutput({ country: "SE", minimum: "50000" });
  if (failed.success) throw new Error("Expected a validation failure.");
  expect(failed.issues[0]?.path).toEqual(["minimum"]);
});

test("supports nested strict objects, arrays, and discriminated unions", () => {
  const task = defineParser({
    input: z.string(),
    output: z.discriminatedUnion("kind", [
      z.strictObject({ kind: z.literal("all"), flags: z.array(z.boolean()).min(1).max(3) }),
      z.strictObject({ kind: z.literal("one"), item: z.strictObject({ id: z.int().positive() }) }),
    ]),
  });
  expect(task.validateOutput({ kind: "all", flags: [true, false] }).success).toBe(true);
  expect(task.validateOutput({ kind: "all", flags: [] }).success).toBe(false);
  expect(task.validateOutput({ kind: "one", item: { id: 2 } }).success).toBe(true);
  expect(task.validateOutput({ kind: "one", item: { id: 2.5 } }).success).toBe(false);
  expect(task.validateOutput({ kind: "one", item: { id: 2, extra: 1 } }).success).toBe(false);
});

test("round-trips detached versioned metadata without Zod instances or executable behavior", () => {
  const task = makeParser();
  const metadata = task.toJSON();
  expect(JSON.parse(JSON.stringify(task))).toEqual(metadata);
  expect(metadata).toMatchObject({
    formatVersion: 1,
    kind: "parser",
    fields: { minimum: { type: "money", aliases: ["ARR"] } },
    input: { type: "string", minLength: 1, maxLength: 200 },
    output: { type: "object", additionalProperties: false, required: ["country", "minimum"] },
  });
  metadata.output.type = "string";
  expect(task.toJSON().output.type).toBe("object");
  expect(JSON.stringify(task)).toBe(JSON.stringify(makeParser()));
});

test("field hints are copied and cannot override schema validation", () => {
  const fields = { x: { type: "application-specific", aliases: ["amount"] } };
  const task = defineParser({
    input: z.string(),
    output: z.strictObject({ x: z.number() }),
    fields,
  });
  fields.x.aliases.push("later");
  expect(task.toJSON().fields.x?.aliases).toEqual(["amount"]);
  expect(task.validateOutput({ x: "one" }).success).toBe(false);
});

test("Zod metadata cannot replace structural validation keywords", () => {
  const task = defineParser({
    input: z.string(),
    output: z.strictObject({
      name: z.string().meta({ type: "number", description: "A name" }),
    }),
  });
  expect(task.toJSON().output.properties?.name).toEqual({ type: "string" });
  expect(task.validateOutput({ name: 1 }).success).toBe(false);
});

test("preserves literal, numeric, length, and regular-expression constraints", () => {
  const task = defineParser({
    input: z.string().length(1),
    output: z.strictObject({
      code: z.string().regex(/^A/).regex(/Z$/),
      count: z.int().gt(1).lt(5),
    }),
  });
  expect(task.validateInput("😀").success).toBe(true);
  expect(task.validateOutput({ code: "AZ", count: 2 }).success).toBe(true);
  for (const data of [
    { code: "A", count: 2 },
    { code: "Z", count: 2 },
    { code: "AZ", count: 5 },
  ]) {
    expect(task.validateOutput(data).success).toBe(false);
  }
  expect(task.toJSON().output.properties?.count).toMatchObject({
    type: "integer",
    exclusiveMinimum: 1,
    exclusiveMaximum: 5,
  });
});
