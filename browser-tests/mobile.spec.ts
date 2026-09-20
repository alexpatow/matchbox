import { expect, test } from "@playwright/test";

test("phone layouts keep file selection and documentation navigation usable", async ({
  page,
  isMobile,
}, testInfo) => {
  test.skip(!isMobile, "Phone-specific layout checks.");
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const picker = page.getByRole("combobox", { name: "Example file" });
    await picker.selectOption({ label: "decode/decode.ts" });
    await expect(page.locator(".model-code")).toContainText("compileClauses");
    expect((await picker.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page
      .locator(".pipeline-explorer")
      .screenshot({ path: testInfo.outputPath(`files-${width}.png`) });
    await page.goto("/docs/getting-started");
    const toggle = page.getByRole("button", { name: "Documentation", exact: true });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await page.getByLabel("Find a page").fill("Runtime API");
    await page
      .getByRole("navigation", { name: "Documentation", exact: true })
      .getByRole("link", { name: "Parser runtime", exact: true })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Runtime API");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.goto("/examples");
    await expect(page.getByLabel("time output")).toContainText('"seconds": 5400');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath(`examples-${width}.png`), fullPage: true });
  }
});
