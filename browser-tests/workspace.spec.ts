import { expect, test } from "@playwright/test";

test("the built React example consumes the local package in a browser", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "The workspace is connected." })).toBeVisible();
  const check = page.getByRole("button", { name: "Check package import" });
  await check.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("Check 1 passed.");
  await check.click();
  await expect(page.getByRole("status")).toContainText("Check 2 passed.");
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
