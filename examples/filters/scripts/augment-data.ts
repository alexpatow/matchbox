import { countries, countryCodes } from "../matchbox/filters/countries/countries";
import { readFile, writeFile } from "node:fs/promises";
// Add supported utterances. This script never reads or writes evaluation cases.
const path = new URL("../matchbox/filters/data/train.jsonl", import.meta.url);
const rows = (await readFile(path, "utf8"))
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));
const inputs = new Set(rows.map((row) => row.input));
function add(input: string, output: unknown) {
  if (!inputs.has(input)) {
    rows.push({ input, output });
    inputs.add(input);
  }
}
for (const [name, code] of [
  ["Swedish", "SE"],
  ["German", "DE"],
  ["French", "FR"],
  ["Norwegian", "NO"],
]) {
  for (const status of ["active", "inactive", "churned"]) {
    for (const value of [20, 40, 80]) {
      const output = {
        and: [
          { field: "status", operator: "eq", value: status },
          { field: "country", operator: "eq", value: code },
          { field: "arr", operator: "gt", value: value! * 1000 },
        ],
      };
      add(`${status} ${name} customers over ${value}k ARR`, output);
      add(`please show ${status} ${name} customers over ${value}k ARR`, output);
    }
  }
}
for (const status of ["active", "inactive", "churned"]) {
  for (const prefix of ["not", "exclude", "without", "hide", "omit"]) {
    add(`${prefix} all ${status} accounts`, { field: "status", operator: "neq", value: status });
    add(`${prefix} the ${status} accounts`, { field: "status", operator: "neq", value: status });
    add(`${prefix} ${status} customers`, { field: "status", operator: "neq", value: status });
  }
}
add("German or Swedish customers under 40k except churned accounts", {
  or: ["DE", "SE"].map((value) => ({
    and: [
      { field: "country", operator: "eq", value },
      { field: "status", operator: "neq", value: "churned" },
      { field: "arr", operator: "lt", value: 40000 },
    ],
  })),
});
add("Swedish customers excluding churned ones", {
  and: [
    { field: "status", operator: "neq", value: "churned" },
    { field: "country", operator: "eq", value: "SE" },
  ],
});
for (const row of [...rows]
  .filter((row) => !row.input.includes("please") && !row.input.endsWith("?"))
  .filter((_, i) => i % 11 === 0)) {
  add(`${row.input} please`, row.output);
  add(`${row.input}?`, row.output);
}

// Teach neutral query framing from training rows; do not change held-out examples.
for (const row of [...rows]
  .filter((row) => !/^(please|show|can|give|could)/.test(row.input))
  .filter((_, i) => i % 19 === 0)) {
  for (const prefix of [
    "please list ",
    "show all ",
    "can you find ",
    "give me ",
    "could you list ",
  ]) {
    add(prefix + row.input, row.output);
  }
}
for (const code of countryCodes) {
  const name = countries[code].aliases[0]!;
  for (const prefix of [
    "companies based in ",
    "list companies from ",
    "only companies from ",
    "find accounts located in ",
  ]) {
    add(prefix + name, { field: "country", operator: "eq", value: code });
  }
}
await writeFile(path, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
