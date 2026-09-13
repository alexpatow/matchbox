import { countries, countryCodes, countryAliases } from "../examples/filters/src/countries";
import { expect, test } from "bun:test";
import {
  createSequenceParser,
  readSequenceArtifact,
  compileClauses,
} from "@matchbox-ai/core/runtime";
import { task, decode, matchesFilter, customers } from "../examples/filters/src/filter";
const model = readSequenceArtifact(
  await Bun.file(
    new URL("../examples/filters/src/generated/filters.matchbox", import.meta.url),
  ).json(),
);
const parser = createSequenceParser(model, task, decode);

test("the packaged learned model composes clauses and normalizes unseen amounts", async () => {
  const result = await parser.parse("active customers and Swedish customers and ARR over €50,001");
  expect(result.status).toBe("ok");
  expect(result.value).toEqual({
    and: [
      { field: "status", operator: "eq", value: "active" },
      { field: "country", operator: "eq", value: "SE" },
      { field: "arr", operator: "gt", value: 50001 },
    ],
  });
  if (result.status === "ok")
    expect(
      customers.filter((row) => matchesFilter(row, result.value)).map((row) => row.name),
    ).toEqual(["Northstar Studio"]);
});

test("AND binds tighter than OR and comparison phrases preserve their internal or", async () => {
  const result = await parser.parse(
    "Swedish customers or German customers and ARR greater than or equal to 75k",
  );
  expect(result.value).toEqual({
    or: [
      { field: "country", operator: "eq", value: "SE" },
      {
        and: [
          { field: "country", operator: "eq", value: "DE" },
          { field: "arr", operator: "gte", value: 75000 },
        ],
      },
    ],
  });
});

test.each([
  "",
  "send email to everyone",
  "ARR over -50k",
  "ARR over 1,2",
  "active Swedish customers over 50k ARR",
  "ARR between 20k and 100k",
  "not active customers",
  "(active customers)",
])("abstains on unsupported input: %s", async (input) => {
  expect((await parser.parse(input)).status).toBe("uncertain");
});

test("rejects malformed artifacts and stale task schemas at initialization", () => {
  expect(() => readSequenceArtifact({ ...model, formatVersion: 2 })).toThrow();
  expect(() => readSequenceArtifact({ ...model, weights: [[]] })).toThrow();
  expect(() => createSequenceParser({ ...model, taskMetadata: {} }, task, decode)).toThrow(
    "schema differ",
  );
});

test("all emitted filters pass schema validation on the fixed evaluation set", async () => {
  const text = await Bun.file(
    new URL("../examples/filters/data/evals.jsonl", import.meta.url),
  ).text();
  for (const line of text.trim().split("\n")) {
    const row = JSON.parse(line);
    const result = await parser.parse(row.input);
    if (result.status === "ok") expect(task.validateOutput(result.value).success).toBe(true);
  }
});

test("the AST compiler refuses partial results when a clause is unrecognized", () => {
  expect(
    compileClauses("active and unknown", (input) => ({
      value: input === "active" ? { field: "status", operator: "eq", value: "active" } : null,
      confidence: 1,
    })).value,
  ).toBeNull();
});

test("every supported country name parses to its code", async () => {
  for (const code of countryCodes) {
    const input = `find accounts based in ${countries[code].name}`;
    expect((await parser.parse(input)).value, input).toEqual({
      field: "country",
      operator: "eq",
      value: code,
    });
  }
});
test("country-name conjunctions remain inside the country span", async () => {
  expect((await parser.parse("Trinidad and Tobago customers and ARR over 50k")).value).toEqual({
    and: [
      { field: "country", operator: "eq", value: "TT" },
      { field: "arr", operator: "gt", value: 50000 },
    ],
  });
});

test("country reference aliases always consume at least one token", () => {
  expect(countryAliases.every((alias) => alias.keys.length > 0)).toBe(true);
});
