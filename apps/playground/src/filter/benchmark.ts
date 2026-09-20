import { measure } from "../benchmark";
import { loadFilters, modelLoadTime } from "./load-filters.js";
const queries = [
  "active customers",
  "Swedish customers and ARR over 50k",
  "German customers or Swedish customers",
];
export async function benchmark(signal?: AbortSignal) {
  const start = performance.now();
  const { default: parser } = await loadFilters();
  const cachedLoadMs = performance.now() - start;
  const selected = await measure(parser, queries, signal);
  return { ...selected, cachedLoadMs, coldModuleLoadMs: modelLoadTime() };
}
