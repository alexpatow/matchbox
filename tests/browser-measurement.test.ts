import { expect, test } from "bun:test";
import { measure } from "../apps/playground/src/benchmark";

test("automatic measurements yield during warmup and retain 300 measured predictions", async () => {
  let calls = 0;
  let callsAtYield = 0;
  const browserTask = new Promise<void>((resolve) => {
    setTimeout(() => {
      callsAtYield = calls;
      resolve();
    }, 0);
  });
  const report = await measure(
    {
      async parse(input) {
        calls++;
        if (input === "unknown") {
          return { status: "uncertain", value: null, confidence: 0, reason: "Uncertain" };
        }
        return { status: "ok", value: input, confidence: 1 };
      },
    },
    ["known", "unknown"],
  );
  await browserTask;
  expect(callsAtYield).toBeGreaterThan(0);
  expect(callsAtYield).toBeLessThanOrEqual(10);
  expect(calls).toBe(320);
  expect(report.samples).toBe(300);
  expect(report.accepted).toBe(150);
  expect(report.inputs).toEqual(["known", "unknown"]);
  expect(report.p95Ms).toBeGreaterThanOrEqual(report.p50Ms);
});

test("leaving a page cancels measurement at the next browser task", async () => {
  const controller = new AbortController();
  let calls = 0;
  setTimeout(() => controller.abort(), 0);
  await expect(
    measure(
      {
        async parse() {
          calls++;
          return { status: "ok", value: {}, confidence: 1 };
        },
      },
      ["input"],
      controller.signal,
    ),
  ).rejects.toThrow();
  expect(calls).toBeGreaterThan(0);
  expect(calls).toBeLessThanOrEqual(10);
});
