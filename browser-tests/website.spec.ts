import { expect, test } from "@playwright/test";
import { stat } from "node:fs/promises";

test("the framework story leads into working documentation", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Build small models");
  await expect(page.getByRole("link", { name: "@shuding" })).toHaveAttribute(
    "href",
    "https://x.com/shuding",
  );
  const footprint = page.getByRole("region", { name: "A model measured in kilobytes." });
  for (const [task, label] of [
    ["filters", "Customer filters"],
    ["money", "Money"],
    ["time", "Date, time & duration"],
    ["is-even", "Parity (training sanity check)"],
  ] as const) {
    const artifact = await stat(`examples/${task}/.matchbox/${task}/model.matchbox`);
    const row = footprint.locator(".model-sizes > div").filter({ hasText: label });
    await expect(row.locator(".model-size")).toHaveText(`${(artifact.size / 1024).toFixed(1)} KiB`);
  }
  await expect(footprint).toContainText("Burn WebAssembly");
  await expect(
    page.getByRole("heading", { name: "Why not run a small LLM in Chrome?" }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("homepage.png"), fullPage: true });
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.getByRole("link", { name: "Get started" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Getting started");
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
  await expect(page.getByRole("main")).not.toContainText("private, and unpublished");
  const links = await page
    .getByRole("navigation", { name: "Documentation" })
    .getByRole("link")
    .evaluateAll((nodes) => nodes.map((node) => (node as HTMLAnchorElement).pathname));
  for (const path of links) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Page not found." })).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.goto("/docs/getting-started");
  await page.screenshot({ path: testInfo.outputPath("documentation.png"), fullPage: true });
});

test("the file explorer supports keyboard navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".model-code span").first()).toBeVisible();
  await expect(page.getByText("Syntax highlighting by", { exact: false })).toBeVisible();
  const source = await page.locator(".model-code").textContent();
  expect(source).toContain("defineParser");
  await page.getByRole("tab", { name: "parser.ts", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("tab", { name: "pipeline.ts", exact: true })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("tokenClassifier");
  await page.getByRole("tab", { name: "recipe.ts", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("annotate(example)");
  await page.getByRole("tab", { name: "data/train-spans.json", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText('"AMOUNT", "USD"');
  await page.getByRole("tab", { name: "data/train-rejections.json", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText('"output": null');
  await page.getByRole("tab", { name: "decode/decode.ts", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("normalizeNumber");
  await page.getByRole("tab", { name: "decode/number-words.ts", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("not learned weights");
  await page.getByRole("tab", { name: "app.ts", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("money.parse");
});
