import { expect, test } from "@playwright/test";
test("sketch recognition runs offline and retains editable geometry", async ({
  page,
  context,
}, testInfo) => {
  await page.goto("/examples");
  await expect(page.getByRole("button", { name: "ellipse", exact: true })).toBeEnabled();
  await context.setOffline(true);
  for (const kind of ["line", "ellipse", "rectangle", "triangle"]) {
    await page.getByRole("button", { name: kind, exact: true }).click();
    await expect(page.getByText(`Recognized ${kind}.`, { exact: true })).toBeVisible();
  }
  await page.getByText("Typed result", { exact: true }).click();
  await expect(page.locator(".sketch-output pre")).toContainText('"vertices"');
  await page.getByLabel("Show original strokes").uncheck();
  await page.screenshot({ path: testInfo.outputPath("sketch.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeDisabled();
});
test("pointer strokes are recognized on release and undoable", async ({ page }) => {
  await page.goto("/examples");
  await expect(page.getByRole("button", { name: "ellipse", exact: true })).toBeEnabled();
  const canvas = page.getByRole("region", { name: "Sketch canvas", exact: true }).locator("canvas");
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  const point = (i: number) => ({
    x: box.x + box.width * (0.5 + Math.cos((i * Math.PI) / 32) * 0.25),
    y: box.y + box.height * (0.5 + Math.sin((i * Math.PI) / 32) * 0.3),
  });
  await page.mouse.move(point(0).x, point(0).y);
  await page.mouse.down();
  for (let i = 1; i <= 64; i++) {
    await page.mouse.move(point(i).x, point(i).y);
  }
  await page.mouse.up();
  await expect(page.getByText("Recognized ellipse.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeDisabled();
  await canvas.scrollIntoViewIfNeeded();
  const lineBox = (await canvas.boundingBox())!;
  await page.mouse.move(lineBox.x + lineBox.width * 0.2, lineBox.y + lineBox.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(lineBox.x + lineBox.width * 0.8, lineBox.y + lineBox.height * 0.7, {
    steps: 30,
  });
  await page.mouse.up();
  await expect(page.getByText("Recognized line.", { exact: true })).toBeVisible();
});
