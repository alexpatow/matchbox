import { expect, test } from "@playwright/test";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
const exec = promisify(execFile);
const root = resolve(".");
const cli = resolve(root, "packages/cli/dist/cli.js");
test("scaffolded workbench trains, predicts locally, evaluates, and protects held-out data", async ({
  page,
  request,
}, info) => {
  test.setTimeout(240_000);
  const directory = await mkdtemp(resolve(tmpdir(), "matchbox-workbench-"));
  await writeFile(
    resolve(directory, "package.json"),
    JSON.stringify({ name: "consumer", scripts: { dev: "vite" } }),
  );
  await exec("bun", [
    cli,
    "init",
    "--skip-install",
    "money",
    "--template",
    "money",
    "--directory",
    directory,
    "--json",
  ]);
  await symlink(resolve(root, "node_modules"), resolve(directory, "node_modules"), "dir");
  const server = spawn("bun", [cli, "dev", "money", "--port", "0", "--no-open"], {
    cwd: directory,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  try {
    const url = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Workbench startup timed out: " + output)),
        15000,
      );
      server.stdout.on("data", (data) => {
        output += data;
        const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) {
          clearTimeout(timeout);
          resolve(match[0]);
        }
      });
      server.stderr.on("data", (data) => {
        output += data;
      });
      server.once("exit", (code) => {
        clearTimeout(timeout);
        reject(new Error(`Workbench exited ${code}: ${output}`));
      });
    });
    const invalid = await request.post(`${url}/api/train`, {
      data: {},
      headers: { Origin: "https://example.com" },
    });
    expect(invalid.status()).toBe(403);
    await page.goto(url);
    await expect(page.getByText("Train your first model.", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Train model", exact: true }).click();
    await expect(page.getByText("The model is ready.", { exact: false })).toBeVisible({
      timeout: 180_000,
    });
    await expect(page.locator(".report")).toContainText("Exact answers");
    await page.getByLabel("Input", { exact: true }).fill("$15");
    await expect(page.getByRole("button", { name: "Predict", exact: true })).toBeEnabled({
      timeout: 10000,
    });
    await page.getByRole("button", { name: "Predict", exact: true }).click();
    await expect(page.locator(".output-pane pre")).toContainText('"amount": 15');
    await page.getByRole("button", { name: "Measure browser speed" }).click();
    await expect(page.locator(".timing")).toContainText("100 runs");
    await page.getByRole("button", { name: "Evaluate", exact: true }).click();
    await expect(page.locator(".report")).toContainText("Exact answers");
    const heldoutPath = resolve(directory, "matchbox/money/evals/test.jsonl");
    const heldout = await readFile(heldoutPath, "utf8");
    const row = JSON.parse(heldout.split("\n")[0]!);
    const rejected = await request.post(`${url}/api/save`, { data: row, headers: { Origin: url } });
    expect(rejected.status()).toBe(400);
    expect(await readFile(heldoutPath, "utf8")).toBe(heldout);
    await page.getByLabel("Input", { exact: true }).fill("twenty euros please");
    await page.getByText("Teach with a correction", { exact: true }).click();
    await page
      .getByLabel("Correct output as JSON")
      .fill('{"amount":20,"currency":"EUR","approximate":false}');
    await page.getByRole("button", { name: "Save training example" }).click();
    await expect(page.locator(".report")).toContainText("Update token supervision");
    await expect(page.getByText("Source changed.", { exact: false })).toBeVisible();
    expect(await readFile(heldoutPath, "utf8")).toBe(heldout);
    await page.getByLabel("Input", { exact: true }).fill("$15");
    await page.route("**/api/**", (route) => route.abort());
    await page.getByRole("button", { name: "Predict", exact: true }).click();
    await expect(page.locator(".output-pane pre")).toContainText('"amount": 15');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath("workbench.png"), fullPage: true });
  } finally {
    await info.attach("workbench-log", { body: output, contentType: "text/plain" });
    server.kill("SIGTERM");
    const terminate = setTimeout(() => server.kill("SIGKILL"), 3000);
    await new Promise<void>((resolve) => {
      if (server.exitCode !== null) {
        resolve();
      } else {
        server.once("exit", () => resolve());
      }
    });
    clearTimeout(terminate);
    await rm(directory, { recursive: true, force: true });
  }
});
