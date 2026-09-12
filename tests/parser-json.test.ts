import { expect, test } from "bun:test";
import { runInNewContext } from "node:vm";
import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";
import { makeParser } from "./parser-fixture";

test("rejects non-JSON values before schema validation can strip or convert them", () => {
  const circular: Record<string, unknown> = {};
  circular.self = circular;
  for (const value of [
    NaN,
    Infinity,
    -Infinity,
    undefined,
    1n,
    Symbol("value"),
    new Date(),
    new Map(),
    circular,
  ]) {
    const result = makeParser().validateOutput({ country: "SE", minimum: 0, owner: value });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues[0]?.code).toBe("invalid_json");
  }
});

test("does not execute accessors or toJSON during validation", () => {
  let invoked = false;
  const value = {
    country: "SE",
    minimum: 0,
    get owner() {
      invoked = true;
      return "alice";
    },
  };
  expect(makeParser().validateOutput(value).success).toBe(false);
  expect(
    makeParser().validateOutput({
      country: "SE",
      minimum: 0,
      toJSON() {
        invoked = true;
      },
    }).success,
  ).toBe(false);
  expect(invoked).toBe(false);
});

test("rejects sparse arrays, symbol keys, and explicit undefined optional values", () => {
  const task = defineParser({ input: z.string(), output: z.array(z.number()) });
  expect(task.validateOutput(new Array(2)).success).toBe(false);
  expect(task.validateOutput(Object.assign(new Array(1), { extra: 1 })).success).toBe(false);
  expect(task.validateOutput(Object.assign([1], { [Symbol("hidden")]: true })).success).toBe(false);
  expect(makeParser().validateOutput({ country: "SE", minimum: 0, owner: undefined }).success).toBe(
    false,
  );
});

test("accepts nested JSON objects and arrays from another realm", () => {
  const value: unknown = runInNewContext(`JSON.parse('{"items":[{"value":42}]}')`);
  expect(Object.getPrototypeOf(value)).not.toBe(Object.prototype);
  const task = defineParser({
    input: z.string(),
    output: z.strictObject({ items: z.array(z.strictObject({ value: z.number() })) }),
  });
  expect(task.validateOutput(value)).toEqual({ success: true, data: { items: [{ value: 42 }] } });
});

test("rejects class instances and custom prototypes in either realm", () => {
  class Output {
    country = "SE";
    minimum = 0;
  }
  for (const value of [
    new Output(),
    runInNewContext('new (class { country = "SE"; minimum = 0; })()'),
    Object.assign(Object.create({}), { country: "SE", minimum: 0 }),
    Object.assign(Object.create(Object.create(null)), { country: "SE", minimum: 0 }),
  ]) {
    const result = makeParser().validateOutput(value);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues[0]?.code).toBe("invalid_json");
  }
});
