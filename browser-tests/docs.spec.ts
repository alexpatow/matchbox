import { expect, test } from "@playwright/test";
test("documentation leads from setup to searchable contracts and CLI anchors", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/getting-started");
  await expect(page.getByRole("heading", { name: "Getting started", exact: true })).toBeVisible();
  await expect(page.locator("main")).toContainText("bunx matchbox-ai init money --template money");
  const toggle = page.getByRole("button", { name: "Documentation", exact: true });
  if (await toggle.isVisible()) {
    await toggle.click();
  }
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
  const toggle = page.getByRole("button", { name: "Documentation", exact: true });
  if (await toggle.isVisible()) {
    await toggle.click();
  }
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

test("documentation uses model highlighting without changing code or adding underlines", async ({
  page,
}) => {
  let modelRequests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/models/lexer.matchbox")) {
      modelRequests++;
    }
  });
  await page.goto("/docs/getting-started");
  const blocks = page.locator(".doc-content .model-code code");
  const source = await blocks.allTextContents();
  expect(source.some((code) => code.includes('await money.parse("twenty dollars")'))).toBe(true);
  await expect(blocks.locator(".lexer-keyword").first()).toBeVisible();
  expect(await blocks.allTextContents()).toEqual(source);
  expect(
    await blocks
      .locator("span")
      .evaluateAll((spans) =>
        spans.every((span) => getComputedStyle(span).textDecorationLine === "none"),
      ),
  ).toBe(true);
  expect(modelRequests).toBe(1);
  await page.goto("/docs/project-structure");
  const tree = page.locator("pre").filter({ hasText: "my-app/" });
  await expect(tree).toBeVisible();
  await expect(tree.locator("span")).toHaveCount(0);
});

test("documentation keeps code readable when the lexer cannot load", async ({ page }) => {
  await page.route("**/models/lexer.matchbox", (route) => route.abort());
  await page.goto("/docs/getting-started");
  await expect(
    page.locator(".doc-content .model-code").filter({ hasText: "import money" }),
  ).toContainText('await money.parse("twenty dollars")');
  await expect(page.getByRole("heading", { name: "Build your app", exact: true })).toBeVisible();
});
