import { build, preview } from "vite";
import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const [wrapper, dataset, destination] = process.argv.slice(2);
if (!wrapper || !dataset || !destination) {
  throw new Error(
    "Usage: bun apps/benchmarks/scripts/recurrent.ts <model.ts> <test.jsonl> <new-report.json>",
  );
}
const corpus = await readFile(resolve(dataset), "utf8");
const rows = corpus
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));
const base = resolve(".matchbox/browser-research");
await mkdir(base, { recursive: true });
const root = await mkdtemp(resolve(base, "recurrent-"));
await writeFile(resolve(root, "index.html"), '<script type="module" src="/main.ts"></script>');
await writeFile(
  resolve(root, "main.ts"),
  `import parser from "recurrent-model";\nimport { measureRecurrent } from "recurrent-measure";\nwindow.measure = (rows) => measureRecurrent(parser, rows);\n`,
);
await build({
  root,
  configFile: false,
  resolve: {
    alias: {
      "recurrent-model": resolve(wrapper),
      "recurrent-measure": fileURLToPath(new URL("../src/measure-recurrent.ts", import.meta.url)),
    },
  },
});
const server = await preview({ root, configFile: false, preview: { host: "127.0.0.1", port: 0 } });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(server.resolvedUrls!.local[0]!);
  await page.waitForFunction(() => "measure" in window);
  const result = await page.evaluate(async (examples) => {
    const measure = (window as unknown as { measure: (rows: unknown) => Promise<unknown> }).measure;
    return await measure(examples);
  }, rows);
  await page.route("**/*", (route) => route.abort());
  const offline = await page.evaluate(async (example) => {
    const measure = (window as unknown as { measure: (rows: unknown) => Promise<unknown> }).measure;
    return await measure([example]);
  }, rows[0]);
  await mkdir(dirname(resolve(destination)), { recursive: true });
  await writeFile(
    resolve(destination),
    JSON.stringify(
      {
        packageSource: "local workspace build",
        browser: browser.version(),
        datasetSha256: createHash("sha256").update(corpus).digest("hex"),
        measurements: result,
        offlineProbe: offline,
        notes:
          "Production Vite build. One timed partial parse per full test document after 20 warmup documents. Cold parse includes model/runtime initialization. No tokenizer-only timing or accepted-output quality claim. Development-machine timings may overlap training/checks.",
      },
      null,
      2,
    ) + "\n",
    { flag: "wx" },
  );
} finally {
  await browser.close();
  await new Promise<void>((done) => server.httpServer.close(() => done()));
}
