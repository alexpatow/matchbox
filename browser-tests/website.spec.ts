import { expect, test } from "@playwright/test";

test("the framework story leads into working documentation", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Compile examples");
  await expect(page.getByRole("link", { name: "@shuding" })).toHaveAttribute(
    "href",
    "https://x.com/shuding",
  );
  await page.screenshot({ path: testInfo.outputPath("homepage.png"), fullPage: true });
  await page.getByRole("link", { name: "Start building" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Getting started");
  await expect(page.getByRole("main")).toContainText("private, and unpublished");
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
