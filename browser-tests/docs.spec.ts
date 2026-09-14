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
