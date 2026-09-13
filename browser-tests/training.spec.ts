import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";
test("trained money and parity artifacts run offline with measured browser latency", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/training");
  await expect(page.locator("#money-status")).toHaveText("Parsed locally from trained weights.");
  await expect(page.locator("#is-even-status")).toHaveText("Parsed locally from trained weights.");
  await expect(page.getByLabel("money output")).toContainText('"amount": 28.65');
  await expect(page.locator("#money-simple-status")).toHaveText(
    "Parsed locally from trained weights.",
  );
  await expect(page.getByLabel("money-simple output", { exact: true })).toContainText(
    '"amount": 15000',
  );
  await page.route("**/*", (route) => route.abort());
  await page.getByRole("button", { name: "about fifty pounds", exact: true }).click();
  await expect(page.getByLabel("money-simple output", { exact: true })).toContainText(
    '"amount": 50',
  );
  await page.getByRole("button", { name: "around twenty six grand in euros", exact: true }).click();
  await expect(page.getByLabel("money output")).toContainText('"amount": 26000');
  await page.getByRole("button", { name: "10001", exact: true }).click();
  await expect(page.getByLabel("is-even output")).toContainText('"even": false');
  const timings: Record<string, unknown> = {};
  for (const name of ["money", "is-even", "money-simple"]) {
    const section = page.locator(`#${name}`).locator("..");
    await section.getByText("Inspect training and browser timing", { exact: true }).click();
    await page.getByRole("button", { name: `Measure ${name}`, exact: true }).click();
    const output = page.getByTestId(`${name}-timing`);
    await expect(output).toBeVisible();
    const result = JSON.parse((await output.textContent())!);
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
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
