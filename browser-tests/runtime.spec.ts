import type { ParseResult, PartialParseResult } from "@matchbox-ai/core/runtime";
declare global {
  interface Window {
    benchmarkRecurrent(gpu?: boolean): Promise<{
      ordinary: ParseResult<unknown>;
      partial: PartialParseResult<unknown>;
      accepted: ParseResult<unknown>;
    }>;
    benchmarkRecord(): Promise<ParseResult<unknown>>;
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

test("Burn models run in the browser and remain available offline", async ({ page }, info) => {
  const wasmResponse = page.waitForResponse((response) => response.url().endsWith(".wasm"));
  await page.goto("http://127.0.0.1:4174");
  await page.waitForFunction(() => typeof window.benchmarkRuntime === "function");
  const result = await page.evaluate(() => window.benchmarkRuntime());
  expect((await wasmResponse).ok()).toBe(true);
  expect(result.runtime).toBe("burn-wasm-cpu");
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
    const failure = report.evaluation.failures.find(
      (row: { input: string }) => row.input === rows[i].input,
    );
    expect(prediction.value).toEqual(failure ? failure.actual : rows[i].output);
    expect(prediction.status).toBe(prediction.value === null ? "uncertain" : "ok");
  });
  const record = await page.evaluate(() => window.benchmarkRecord());
  expect(record).toMatchObject({
    status: "ok",
    value: { amount: 15000, currency: "EUR", approximate: true },
  });
  await page.route("**/*", (route) => route.abort());
  const offline = await page.evaluate(() => window.benchmarkRuntime());
  expect(offline.results).toEqual(result.results);
  expect(await page.evaluate(() => window.benchmarkRecord())).toEqual(record);
  await writeFile(
    info.outputPath("burn-runtime.json"),
    JSON.stringify({ project: info.project.name, ...result }, null, 2),
  );
});

test("recurrent generated wrapper supports opt-in partial results offline", async ({ page }) => {
  await page.goto("http://127.0.0.1:4174");
  await page.waitForFunction(() => typeof window.benchmarkRecurrent === "function");
  const result = await page.evaluate(() => window.benchmarkRecurrent());
  expect(result.ordinary.status).toBe("uncertain");
  expect(result.partial.status).toBe("partial");
  if (result.partial.status === "partial") {
    expect(result.partial.uncertainRanges.length).toBeGreaterThan(0);
    expect(result.partial.confidence).toBeLessThan(0.75);
  }
  expect(result.accepted.status).toBe("ok");
  await page.route("**/*", (route) => route.abort());
  expect(await page.evaluate(() => window.benchmarkRecurrent())).toEqual(result);
});

test("CPU parsing avoids GPU downloads and explicit GPU requests report missing support", async ({
  page,
}) => {
  const requested: string[] = [];
  page.on("request", (request) => requested.push(request.url()));
  await page.addInitScript(() => Object.defineProperty(navigator, "gpu", { value: undefined }));
  await page.goto("http://127.0.0.1:4174");
  await page.waitForFunction(() => typeof window.benchmarkRecurrent === "function");
  await page.evaluate(() => window.benchmarkRecurrent());
  expect(requested.some((url) => url.includes("matchbox_webgpu"))).toBe(false);
  await expect(page.evaluate(() => window.benchmarkRecurrent(true))).rejects.toThrow(
    "WebGPU is unavailable",
  );
  expect(requested.some((url) => url.includes("matchbox_webgpu") && url.endsWith(".wasm"))).toBe(
    false,
  );
  expect((await page.evaluate(() => window.benchmarkRecurrent())).accepted.status).toBe("ok");
});

test("WebGPU recurrent parsing preserves CPU outputs and cached offline execution", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:4174");
  await page.waitForFunction(() => typeof window.benchmarkRecurrent === "function");
  const available = await page.evaluate(async () => {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    return !!(gpu && (await gpu.requestAdapter()));
  });
  test.skip(!available, "This browser runner has no WebGPU adapter.");
  const cpu = await page.evaluate(() => window.benchmarkRecurrent());
  const gpu = await page.evaluate(() => window.benchmarkRecurrent(true));
  for (const key of ["ordinary", "partial", "accepted"] as const) {
    expect(gpu[key].status).toBe(cpu[key].status);
    expect(gpu[key].value).toEqual(cpu[key].value);
    expect(gpu[key].confidence).toBeCloseTo(cpu[key].confidence, 4);
  }
  await page.route("**/*", (route) => route.abort());
  expect(await page.evaluate(() => window.benchmarkRecurrent(true))).toEqual(gpu);
});
