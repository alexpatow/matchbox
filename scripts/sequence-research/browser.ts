/** Diagnostic inference timings, not accepted parser throughput. */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { cpus } from "node:os";
import { chromium } from "@playwright/test";

const [modelPath, validationPath, outputPath] = process.argv.slice(2);
if (!modelPath || !validationPath || !outputPath) {
  throw new Error(
    "Usage: bun scripts/sequence-research/browser.ts <model> <validation.jsonl> <new-report.json>",
  );
}
const model = await readFile(modelPath, "utf8");
const validation = await readFile(validationPath, "utf8");
const rows = validation
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line) as { input: string });
const inputs = [128, 512].map((length) => {
  const row = rows.find(({ input }) => input.length >= length);
  if (!row) {
    throw new Error(`No validation input with ${length} UTF-16 units.`);
  }
  return row.input.slice(0, length);
});
const bundle = await Bun.build({
  entrypoints: ["scripts/sequence-research/browser-client.ts"],
  target: "browser",
  format: "esm",
});
if (!bundle.success) {
  throw new AggregateError(bundle.logs, "Browser research bundle failed.");
}
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === "/research-model") {
      return new Response(model, { headers: { "Content-Type": "application/json" } });
    }
    if (path === "/research-inputs") {
      return Response.json(inputs);
    }
    if (path === "/browser-client.js") {
      return new Response(bundle.outputs[0], { headers: { "Content-Type": "text/javascript" } });
    }
    if (path === "/matchbox_wasm_bg.wasm") {
      return new Response(Bun.file("packages/core/wasm/matchbox_wasm_bg.wasm"));
    }
    return new Response("<!doctype html><title>Sequence research</title>", {
      headers: { "Content-Type": "text/html" },
    });
  },
});
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.port}/`);
  const result = await page.evaluate(async () => {
    // Import the bundled browser entry over HTTP.
    const path = "/browser-client.js";
    return (await import(path)).benchmark();
  });
  const hash = (text: string) => createHash("sha256").update(text).digest("hex");
  await writeFile(
    outputPath,
    JSON.stringify(
      {
        researchOnly: true,
        browser: browser.version(),
        headless: true,
        cpu: cpus()[0]?.model,
        measuredAt: new Date().toISOString(),
        artifactSha256: hash(model),
        validationSha256: hash(validation),
        method:
          "WASM diagnostic token predictions. Five warmups, thirty sequential calls per input. Initialization excludes import and model fetch. No parser acceptance or decoder timing.",
        ...result,
      },
      null,
      2,
    ),
    { flag: "wx" },
  );
} finally {
  await browser.close();
  await server.stop(true);
}
