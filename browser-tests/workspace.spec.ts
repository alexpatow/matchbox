import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test("the generated model parses locally, filters customers, and handles uncertainty", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("The model is ready");
  // After initial static assets load, inference must work with the network blocked.
  await page.route("**/*", (route) => route.abort());
  await page
    .getByRole("button", {
      name: "active Swedish customers over 50k ARR",
      exact: true,
    })
    .click();
  await expect(page.getByRole("status")).toContainText("Parsed locally");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("Northstar Studio");
  await expect(page.getByLabel("Parsed filters")).toContainText("ARR > 50,000");
  await page
    .getByRole("button", {
      name: "German or Swedish customers under 50k except churned ones",
      exact: true,
    })
    .click();
  await expect(page.getByRole("status")).toContainText("Parsed locally");
  await expect(page.getByLabel("Parsed filters")).toContainText("ARR < 50,000");
  await expect(page.getByLabel("Parser output")).toContainText('"or"');
  await page.screenshot({ path: testInfo.outputPath("demo.png"), fullPage: true });
  await page
    .getByRole("textbox", { name: "Filter customers", exact: true })
    .fill("send email to everyone");
  await expect(page.getByRole("status")).toContainText("Uncertain");
  await expect(page.locator("tbody tr")).toHaveCount(8);
  await page.getByRole("textbox", { name: "Filter customers", exact: true }).fill("");
  await expect(page.getByRole("status")).toContainText("All customers are shown");
  await page
    .getByRole("textbox", { name: "Filter customers", exact: true })
    .fill("French customers");
  await expect(page.getByLabel("Parsed filters")).toContainText("France");
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await expect(page.getByText("No customers match these filters.")).toBeVisible();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("measures real browser inference and enforces a generous regression budget", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("The model is ready");
  await page.getByRole("button", { name: "Measure this browser" }).click();
  const output = page.getByTestId("benchmark");
  await expect(output).toBeVisible();
  const metrics = JSON.parse((await output.getAttribute("data-report"))!);
  await expect(output).toContainText("Typical time per input");
  await expect(output).toContainText("95% of runs finished within");
  await expect(output).toContainText("Half of the timed runs");
  await expect(output).toContainText("Answer correctness is checked separately");
  await page.getByText("What does this test measure?", { exact: true }).click();
  await expect(page.locator("#benchmark")).toContainText("Swedish customers and ARR over 50k");
  await page.locator("#benchmark").screenshot({ path: testInfo.outputPath("benchmark-panel.png") });
  await writeFile(
    testInfo.outputPath("browser-benchmark.json"),
    JSON.stringify({ project: testInfo.project.name, ...metrics }, null, 2),
  );
  expect(metrics).not.toHaveProperty("candidates");
  await expect(page.getByText("Compare with a handwritten rule parser")).toHaveCount(0);
  expect(metrics.samples).toBe(300);
  expect(metrics.p95Ms).toBeLessThan(50);
  await testInfo.attach("browser-benchmark.json", {
    body: JSON.stringify({ project: testInfo.project.name, ...metrics }),
    contentType: "application/json",
  });
});
