import { expect, test } from "@playwright/test";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { samples } from "../apps/playground/src/sketch/samples";
test("the workbench parses structured JSON locally and exposes numeric predictions", async ({
  page,
}) => {
  const server = spawn(
    "bun",
    [resolve("packages/cli/dist/cli.js"), "dev", "examples/sketch", "--port", "0", "--no-open"],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let output = "";
  try {
    const url = await new Promise<string>((done, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Workbench startup timed out: " + output)),
        15000,
      );
      server.stdout.on("data", (data) => {
        output += data;
        const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) {
          clearTimeout(timer);
          done(match[0]);
        }
      });
      server.stderr.on("data", (data) => {
        output += data;
      });
      server.once("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`Workbench exited ${code}: ${output}`));
      });
    });
    await page.goto(url);
    await page
      .getByLabel("Input (JSON)", { exact: true })
      .fill(JSON.stringify({ points: samples.ellipse }));
    await page.getByRole("button", { name: "Predict", exact: true }).click();
    await expect(page.locator(".output-pane pre")).toContainText('"kind": "ellipse"');
    await page.getByRole("button", { name: "Inspect recognition", exact: true }).click();
    await expect(page.locator(".report")).toContainText('"probabilities"');
    await expect(page.locator(".report")).toContainText('"kind": "ellipse"');
  } finally {
    server.kill("SIGTERM");
  }
});
