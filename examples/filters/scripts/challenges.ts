import { writeFile } from "node:fs/promises";
import filters from "../.matchbox/filters/model";
import baseline from "../matchbox/filters/evals/baseline";
import challenges from "../matchbox/filters/evals/research.json";
const results = [];
for (const row of challenges) {
  results.push({
    ...row,
    learned: await filters.parse(row.input),
    baseline: await baseline.parse(row.input),
  });
}
await writeFile(
  new URL("../.matchbox/filters/challenges.report.json", import.meta.url),
  JSON.stringify(results, null, 2) + "\n",
);
console.log(JSON.stringify(results, null, 2));
