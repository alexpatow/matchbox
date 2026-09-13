import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./browser-tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "bun run build && bun run preview",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: "bun run --filter @matchbox-ai/benchmarks preview",
      url: "http://127.0.0.1:4174",
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
