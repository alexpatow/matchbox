import type { ParseResult } from "@matchbox-ai/core/runtime";
declare global {
  interface Window {
    benchmarkRuntime(): Promise<{
      runtime: string;
      coldFirstParseMs: number;
      samples: number;
      p50Ms: number | undefined;
      p95Ms: number | undefined;
      first: ParseResult<unknown>;
      results: ParseResult<unknown>[];
    }>;
  }
}
import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

test("TensorFlow models run in the browser and remain available offline", async ({
  page,
}, info) => {
  await page.goto("http://127.0.0.1:4174");
  await page.waitForFunction(() => typeof window.benchmarkRuntime === "function");
  const result = await page.evaluate(() => window.benchmarkRuntime());
  expect(result.results.length).toBeGreaterThan(0);
  const root = new URL("../examples/money/", import.meta.url);
  const report = JSON.parse(await readFile(new URL(".matchbox/money/report.json", root), "utf8"));
  const rows = (await readFile(new URL("matchbox/money/evals/test.jsonl", root), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  expect(result.results).toHaveLength(rows.length);
  // Browser execution must match exported-model evaluation, including honest abstentions.
  result.results.forEach((prediction, i) => {
    const failure = report.quantized.failures.find(
      (row: { input: string }) => row.input === rows[i].input,
    );
    expect(prediction.value).toEqual(failure ? failure.actual : rows[i].output);
    expect(prediction.status).toBe(prediction.value === null ? "uncertain" : "ok");
  });
  await page.route("**/*", (route) => route.abort());
  const offline = await page.evaluate(() => window.benchmarkRuntime());
  expect(offline.results).toEqual(result.results);
  await writeFile(
    info.outputPath("tensorflow-runtime.json"),
    JSON.stringify({ project: info.project.name, ...result }, null, 2),
  );
});
