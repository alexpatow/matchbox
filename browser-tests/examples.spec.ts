import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";
test("trained time and money artifacts run offline with measured browser latency", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/examples");
  await expect(page.getByLabel("time output")).toContainText('"seconds": 5400');
  await expect(page.getByLabel("money output")).toContainText('"amount": 28.65');
  await page.route("**/*", (route) => route.abort());
  await page.getByRole("button", { name: "around twenty six grand in euros", exact: true }).click();
  await expect(page.getByLabel("money output")).toContainText('"amount": 26000');
  await page.getByRole("button", { name: "tomorrow at 3:30 pm", exact: true }).click();
  await expect(page.getByLabel("time output")).toContainText('"hour": 15');
  await expect(page.getByLabel("time output")).toContainText('"minute": 30');
  const timings: Record<string, unknown> = {};
  for (const name of ["time", "money"]) {
    const output = page.getByTestId(`${name}-timing`);
    await expect(output).toBeVisible();
    const result = JSON.parse((await output.getAttribute("data-report"))!);
    expect(result.samples).toBe(300);
    expect(result.accepted).toBe(300);
    expect(result.p95Ms).toBeLessThan(50);
    timings[name] = result;
  }
  await writeFile(
    testInfo.outputPath("neural-browser-benchmark.json"),
    JSON.stringify({ project: testInfo.project.name, timings }, null, 2),
  );
  await page.screenshot({ path: testInfo.outputPath("trained-examples.png"), fullPage: true });
  await page.getByRole("button", { name: "$15", exact: true }).click();
  await expect(page.getByLabel("money output")).toContainText('"amount": 15');
  await expect(page.getByLabel("money output")).toContainText('"currency": "USD"');
  await page.getByRole("button", { name: "next Friday at noon", exact: true }).click();
  await expect(page.getByLabel("time output")).toContainText('"status": "uncertain"');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
