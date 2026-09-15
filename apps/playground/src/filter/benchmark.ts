import type { MatchboxParser } from "@matchbox-ai/core/runtime";
import { loadFilters, modelLoadTime } from "./load-filters.js";
async function measure(parser: MatchboxParser<unknown>) {
  const queries = [
    "active customers",
    "Swedish customers and ARR over 50k",
    "German customers or Swedish customers",
  ];
  for (let i = 0; i < 20; i++) {
    await parser.parse(queries[i % queries.length]!);
  }
  const timings: number[] = [];
  let accepted = 0;
  for (let i = 0; i < 300; i++) {
    const start = performance.now();
    const result = await parser.parse(queries[i % queries.length]!);
    timings.push(performance.now() - start);
    if (result.status === "ok") {
      accepted++;
    }
  }
  timings.sort((a, b) => a - b);
  return {
    inputs: queries,
    samples: timings.length,
    accepted,
    p50Ms: timings[149]!,
    p95Ms: timings[284]!,
  };
}
export async function benchmark() {
  const start = performance.now();
  const { default: parser } = await loadFilters();
  const cachedLoadMs = performance.now() - start;
  const selected = await measure(parser);
  return { ...selected, cachedLoadMs, coldModuleLoadMs: modelLoadTime() };
}
