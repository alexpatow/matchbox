import { expect, test } from "@playwright/test";
import { stat } from "node:fs/promises";

test("the framework story leads into working documentation", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Build small models");
  await expect(page.getByRole("link", { name: "@shuding" })).toHaveAttribute(
    "href",
    "https://x.com/shuding",
  );
  const artifact = await stat("examples/filters/.matchbox/filters/model.matchbox");
  await expect(page.locator(".filter-model-size")).toHaveText(
    `${(artifact.size / 1024).toFixed(1)} KiB model`,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("homepage.png"), fullPage: true });
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.getByRole("link", { name: "Get started" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Getting started");
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
  await expect(page.getByRole("main")).not.toContainText("private, and unpublished");
  const docsToggle = page.getByRole("button", { name: "Documentation", exact: true });
  if (await docsToggle.isVisible()) {
    await docsToggle.click();
  }
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
  expect(source).toContain("filters.parse");
  const picker = page.getByRole("combobox", { name: "Example file" });
  async function selectFile(name: string) {
    if (await picker.isVisible()) {
      await picker.selectOption({ label: name });
    } else {
      await page.getByRole("tab", { name, exact: true }).click();
    }
  }
  if (await picker.isVisible()) {
    await selectFile("pipeline.ts");
  } else {
    await page.getByRole("tab", { name: "parser.ts", exact: true }).focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("tab", { name: "pipeline.ts", exact: true })).toBeFocused();
  }
  await expect(
    page.getByRole("tabpanel").filter({ has: page.locator(".model-code") }),
  ).toContainText("tokenClassifier");
  await selectFile("recipe.ts");
  await expect(
    page.getByRole("tabpanel").filter({ has: page.locator(".model-code") }),
  ).toContainText("annotate(_example, tokens)");
  await selectFile("decode/decode.ts");
  await expect(
    page.getByRole("tabpanel").filter({ has: page.locator(".model-code") }),
  ).toContainText("compileClauses");
  await selectFile("app.ts");
  await expect(
    page.getByRole("tabpanel").filter({ has: page.locator(".model-code") }),
  ).toContainText("filters.parse");
});
