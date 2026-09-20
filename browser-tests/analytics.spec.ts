import { expect, test } from "@playwright/test";

test("analytics loads once and follows client-side navigation", async ({ page }) => {
  await page.route("**/_vercel/**/script.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await page.goto("/");
  const analytics = page.locator('script[src="/_vercel/insights/script.js"]');
  const speedInsights = page.locator('script[src="/_vercel/speed-insights/script.js"]');
  await expect(analytics).toHaveCount(1);
  await expect(speedInsights).toHaveCount(1);
  await expect(speedInsights).toHaveAttribute("data-route", "/");
  await page.getByRole("link", { name: "Get started", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Getting started", exact: true })).toBeVisible();
  await expect(speedInsights).toHaveAttribute("data-route", "/docs/getting-started");
  const events = await page.evaluate(() => (window as unknown as { vaq: unknown[] }).vaq);
  expect(events).toContainEqual([
    "pageview",
    { route: "/docs/getting-started", path: "/docs/getting-started" },
  ]);
  await expect(analytics).toHaveCount(1);
  await expect(speedInsights).toHaveCount(1);
});
