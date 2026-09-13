import { writeFile } from "node:fs/promises";
import filters from "../src/generated/filters";
import baseline from "../src/filter/baseline";
import challenges from "../data/challenges.json";
const results = [];
for (const row of challenges) {
  results.push({
    ...row,
    learned: await filters.parse(row.input),
    baseline: await baseline.parse(row.input),
  });
}
await writeFile(
  new URL("../src/generated/challenges.report.json", import.meta.url),
  JSON.stringify(results, null, 2) + "\n",
);
console.log(JSON.stringify(results, null, 2));
