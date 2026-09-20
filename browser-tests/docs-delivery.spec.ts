import { expect, test } from "@playwright/test";

test("agent docs and clipboard use the same Markdown source", async ({ page, request }) => {
  const markdown = await request.get("/docs/examples/lexer.md");
  expect(markdown.ok()).toBe(true);
  const source = await markdown.text();
  expect(source).toContain("# Syntax highlighting");
  expect(source).not.toContain("<!doctype html>");
  const index = await request.get("/llms.txt");
  expect(await index.text()).toContain("/docs/examples/lexer.md");
  const skill = await request.get("/skills/matchbox/SKILL.md");
  expect(await skill.text()).toContain("name: matchbox");
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          document.documentElement.dataset.copied = text;
        },
      },
      configurable: true,
    });
  });
  await page.goto("/docs/examples/lexer");
  await page.getByRole("button", { name: "Copy as Markdown", exact: true }).click();
  await expect(page.getByText("Markdown copied.", { exact: true })).toBeAttached();
  expect(await page.locator("html").getAttribute("data-copied")).toBe(source);
  await page.goto("/docs/agents");
  await expect(page.getByText("Markdown copied.", { exact: true })).toHaveCount(0);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Denied");
        },
      },
    });
  });
  await page.getByRole("button", { name: "Copy as Markdown", exact: true }).click();
  await expect(page.getByText("Could not copy. Please try again.")).toBeVisible();
});

test("the lexer demo loads evaluated weights and highlights source offline", async ({
  page,
  context,
}, testInfo) => {
  await page.goto("/docs/examples/lexer");
  const demo = page.getByRole("region", { name: "Syntax highlighting", exact: true });
  await expect(demo.getByRole("status")).toContainText(/^(partial|ok) ·/, { timeout: 30000 });
  const input = demo.getByLabel("Edit source code", { exact: true });
  await expect(demo.locator(".lexer-output")).toHaveText(await input.inputValue());
  await expect(demo.locator(".lexer-uncertain").first()).toBeVisible();
  await demo.screenshot({ path: testInfo.outputPath("lexer-demo.png") });
  await context.setOffline(true);
  const changed = 'const message = "Hello"; // keep the comment\n';
  await input.fill(changed);
  await expect(demo.getByRole("status")).toContainText(/^(partial|ok|uncertain) ·/);
  expect(await demo.locator(".lexer-output").textContent()).toBe(changed);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
