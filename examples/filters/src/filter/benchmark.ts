import type { MatchboxParser } from "@matchbox-ai/core/runtime";
import { loadFilters, modelLoadTime } from "./load-filters.js";
async function measure(parser: MatchboxParser<unknown>) {
  const queries = [
    "active customers",
    "Swedish customers and ARR over 50k",
    "German customers or Swedish customers",
  ];
  for (let i = 0; i < 20; i++) await parser.parse(queries[i % queries.length]!);
  const timings: number[] = [];
  let accepted = 0;
  for (let i = 0; i < 300; i++) {
    const start = performance.now();
    const result = await parser.parse(queries[i % queries.length]!);
    timings.push(performance.now() - start);
    if (result.status === "ok") accepted++;
  }
  timings.sort((a, b) => a - b);
  return { samples: timings.length, accepted, p50Ms: timings[149]!, p95Ms: timings[284]! };
}
export async function benchmark() {
  const start = performance.now();
  const { default: parser } = await loadFilters();
  const cachedLoadMs = performance.now() - start;
  const selected = await measure(parser);
  const candidates = [];
  // Comparison artifacts are lazy imports and never load during ordinary filtering.
  const loaders = [
    { name: "centroid", load: () => import("../generated/centroid.matchbox") },
    { name: "linear", load: () => import("../generated/linear.matchbox") },
    { name: "rules", load: () => import("./baseline") },
  ];
  for (const candidate of loaders) {
    const start = performance.now();
    const model = await candidate.load();
    const moduleLoadMs = performance.now() - start;
    candidates.push({ algorithm: candidate.name, moduleLoadMs, ...(await measure(model.default)) });
  }
  return { ...selected, cachedLoadMs, coldModuleLoadMs: modelLoadTime(), candidates };
}
