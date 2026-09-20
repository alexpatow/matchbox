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

test("phone filter demo shows a complete query and customer without sideways scrolling", async ({
  page,
  isMobile,
}, testInfo) => {
  test.skip(!isMobile, "Phone-specific layout checks.");
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const query = page.getByRole("textbox", { name: "Filter customers", exact: true });
    await expect(query).toHaveValue("active Swedish customers over 50k ARR");
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.getByLabel("Parsed filters")).toContainText("country = Sweden");
    await expect(page.locator(".customer-summary")).toBeVisible();
    await expect(page.locator(".customer-summary")).toContainText("SE");
    await expect(page.locator(".customer-summary")).toContainText("active");
    await expect(page.locator("tbody")).toContainText("125,000");
    expect(
      await page
        .locator(".table-scroll")
        .evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    await page
      .getByRole("button", {
        name: "German or Swedish customers under 50k except churned ones",
        exact: true,
      })
      .click();
    await expect(page.getByLabel("Parsed filters")).toContainText("OR");
    expect(
      await query.evaluate(
        (element: HTMLTextAreaElement) => element.scrollHeight <= element.clientHeight,
      ),
    ).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page
      .locator(".filter-demo-panel")
      .screenshot({ path: testInfo.outputPath(`filters-${width}.png`) });
  }
});
