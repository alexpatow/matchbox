import { expect, test } from "@playwright/test";
test("documentation leads from setup to searchable contracts and CLI anchors", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/getting-started");
  await expect(page.getByRole("heading", { name: "Getting started", exact: true })).toBeVisible();
  await expect(page.locator("main")).toContainText("bunx matchbox-ai init money --template money");
  await page.getByLabel("Find a page").fill("SequenceRecipe");
  await page
    .getByRole("navigation", { name: "Documentation", exact: true })
    .getByRole("link", { name: "Tokens & decoders" })
    .click();
  await expect(page.getByRole("heading", { name: "SequenceRecipe", exact: true })).toBeVisible();
  await page.goto("/docs/cli#save");
  await expect(page.locator("h2#save")).toBeInViewport();
  await page.goto("/docs/reference/README");
  await page.getByRole("link", { name: "Runtime", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Runtime API", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("docs-reference.png"), fullPage: true });
});

test("training and evaluating have separate guides and readable prose spacing", async ({
  page,
}) => {
  await page.goto("/docs/training");
  const navigation = page.getByRole("navigation", { name: "Documentation", exact: true });
  await expect(navigation.getByText("Training", { exact: true })).toBeVisible();
  await expect(navigation.getByText("Evaluating", { exact: true })).toBeAttached();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Train a model");
  expect(
    await page.locator(".doc-content ol").evaluate((list) => getComputedStyle(list).listStyleType),
  ).toBe("decimal");
  await page.goto("/docs/reference/evaluation");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Evaluation API");
  await expect(page.locator(".doc-content td:last-child").first()).toHaveCSS("text-align", "left");
  const tableGap = await page
    .locator(".doc-content table")
    .evaluate(
      (table) =>
        table.nextElementSibling!.getBoundingClientRect().top -
        table.getBoundingClientRect().bottom,
    );
  expect(tableGap).toBeGreaterThanOrEqual(20);
  await page.goto("/docs/reference/runtime");
  const paragraphGap = await page
    .locator(".doc-content > p + p")
    .first()
    .evaluate(
      (paragraph) =>
        paragraph.getBoundingClientRect().top -
        paragraph.previousElementSibling!.getBoundingClientRect().bottom,
    );
  expect(paragraphGap).toBeGreaterThanOrEqual(20);
});
