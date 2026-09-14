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
import { writeFile } from "node:fs/promises";

test("TensorFlow models run in the browser and remain available offline", async ({
  page,
}, info) => {
  await page.goto("http://127.0.0.1:4174");
  await page.waitForFunction(() => typeof window.benchmarkRuntime === "function");
  const result = await page.evaluate(() => window.benchmarkRuntime());
  expect(result.results.length).toBeGreaterThan(0);
  result.results.forEach((prediction) => expect(prediction.status).toBe("ok"));
  await page.route("**/*", (route) => route.abort());
  const offline = await page.evaluate(() => window.benchmarkRuntime());
  expect(offline.results).toEqual(result.results);
  await writeFile(
    info.outputPath("tensorflow-runtime.json"),
    JSON.stringify({ project: info.project.name, ...result }, null, 2),
  );
});
