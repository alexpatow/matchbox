import { build, preview } from "vite";
import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { summarize } from "../src/lexer-comparison/score.js";
import type { DocumentScore } from "../src/lexer-comparison/score.js";
const [taskDirectory, corpusDirectory, referenceDirectory, destination, split = "validation"] =
  process.argv.slice(2);
if (
  !taskDirectory ||
  !corpusDirectory ||
  !referenceDirectory ||
  !destination ||
  !["validation", "test"].includes(split)
) {
  throw new Error(
    "Usage: bun compare-lexer.ts <trained-task-dir> <corpus-dir> <installed-gpu-lexer-dir> <new-report> [validation|test]",
  );
}
const reference = JSON.parse(await readFile(resolve(referenceDirectory, "package.json"), "utf8"));
if (reference.name !== "gpu-lexer" || reference.version !== "0.0.2") {
  throw new Error("Reference must be gpu-lexer 0.0.2");
}
const source = await readFile(resolve(corpusDirectory, `${split}.jsonl`), "utf8");
const metadata = JSON.parse(
  await readFile(resolve(corpusDirectory, `${split}-sources.json`), "utf8"),
);
const rows = source
  .trim()
  .split("\n")
  .map((line, i) => ({ ...JSON.parse(line), language: metadata[i].language }));
const artifactPath = resolve(taskDirectory, "output/model.matchbox");
const artifact = await readFile(artifactPath, "utf8");
const model = JSON.parse(artifact);
const base = resolve(".matchbox/browser-research");
await mkdir(base, { recursive: true });
const root = await mkdtemp(resolve(base, "comparison-"));
await writeFile(resolve(root, "index.html"), '<script type="module" src="/main.ts"></script>');
await writeFile(resolve(root, "artifact.ts"), `export default ${artifact} as const;`);
await writeFile(
  resolve(root, "main.ts"),
  `
import { score } from "comparison-score";
window.run = async (engine, rows) => {
  const cold = performance.now();
  let parse, dispose = () => {};
  if (engine === "gpu-lexer") {
    const module = await import("reference");
    parse = async (input) => ({ status: "candidate", value: await module.parse(input) });
  } else if (engine === "matchbox-candidate") {
    const [{ tensorPredictor }, { default: artifact }, { default: decode }] = await Promise.all([import("@matchbox-ai/core/internal"), import("comparison-artifact"), import("comparison-decode")]);
    const predictor = await tensorPredictor(artifact);
    dispose = () => predictor.dispose();
    parse = async (input) => ({ status: "candidate", value: decode(predictor.sequence(input), input) });
  } else {
    const { default: model } = await import("comparison-model");
    dispose = () => model.dispose();
    parse = (input) => model.parse(input, { allowPartial: true, gpu: engine === "matchbox-gpu" });
  }
  await parse("const answer = 42;");
  const initializationMs = performance.now() - cold;
  const documents = [], timings = [], statuses = {};
  try {
    for (const row of rows.slice(0,20)) { await parse(row.input); }
    for (const row of rows) {
      const tick = performance.now();
      const result = await parse(row.input);
      timings.push(performance.now() - tick);
      statuses[result.status] = (statuses[result.status] ?? 0) + 1;
      const signature = JSON.stringify({ value: result.value, ranges: result.uncertainRanges?.map(({start,end}) => [start,end]) });
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(signature));
      const outputSha256 = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2,"0")).join("");
      documents.push({ ...score(row, result.value), outputSha256, status: result.status, confidence: result.confidence ?? null });
    }
    const repeated = [];
    for (const row of rows) {
      const tick = performance.now();
      await parse(row.input);
      repeated.push(performance.now() - tick);
    }
    repeated.sort((a,b) => a-b);
    timings.sort((a,b) => a-b);
    return { initializationMs, repeatP50Ms: repeated[Math.floor((repeated.length-1)*.5)], repeatP95Ms: repeated[Math.floor((repeated.length-1)*.95)], p50Ms: timings[Math.floor((timings.length-1)*.5)], p95Ms: timings[Math.floor((timings.length-1)*.95)], documents, statuses };
  } finally { dispose(); }
};
`,
);
await build({
  root,
  configFile: false,
  resolve: {
    alias: {
      reference: resolve(referenceDirectory, "dist/index.js"),
      "comparison-score": fileURLToPath(
        new URL("../src/lexer-comparison/score.ts", import.meta.url),
      ),
      "comparison-artifact": resolve(root, "artifact.ts"),
      "comparison-decode": resolve(dirname(artifactPath), model.decoderModule),
      "comparison-model": resolve(taskDirectory, "output/model.ts"),
    },
  },
});
const server = await preview({ root, configFile: false, preview: { host: "127.0.0.1", port: 0 } });
const browser = await chromium.launch({ headless: false });
try {
  const results = [];
  for (const engine of ["gpu-lexer", "matchbox-candidate", "matchbox-partial", "matchbox-gpu"]) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      const downloads: Promise<{
        name: string;
        bytes: number;
        gzipBytes: number;
        sha256: string;
      }>[] = [];
      page.on("response", (response) => {
        const name = new URL(response.url()).pathname;
        if (!/\.(js|wasm)$/.test(name)) {
          return;
        }
        downloads.push(
          response.body().then((body) => ({
            name,
            bytes: body.byteLength,
            gzipBytes: gzipSync(body).byteLength,
            sha256: createHash("sha256").update(body).digest("hex"),
          })),
        );
      });
      await page.goto(server.resolvedUrls!.local[0]!);
      await page.waitForFunction(() => "run" in window);
      const result = await page.evaluate(
        async ({ engine, rows }) => {
          const run = (
            window as unknown as {
              run: (engine: string, rows: unknown[]) => Promise<{ documents: DocumentScore[] }>;
            }
          ).run;
          return await run(engine, rows);
        },
        { engine, rows },
      );
      const languages = [...new Set(result.documents.map((doc) => doc.language))].map(
        (language) => ({
          language,
          ...summarize(result.documents.filter((doc) => doc.language === language)),
        }),
      );
      const assets = await Promise.all(downloads);
      results.push({
        engine,
        ...result,
        quality: summarize(result.documents),
        languages,
        assets,
        downloadBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
        downloadGzipBytes: assets.reduce((sum, asset) => sum + asset.gzipBytes, 0),
      });
      console.log(engine, summarize(result.documents).agreement);
    } finally {
      await context.close();
    }
  }
  const hash = (text: string) => createHash("sha256").update(text).digest("hex");
  await writeFile(
    destination,
    JSON.stringify(
      {
        reference: {
          package: "gpu-lexer",
          version: "0.0.2",
          bundleSha256: hash(await readFile(resolve(referenceDirectory, "dist/index.js"), "utf8")),
        },
        datasetSha256: hash(source),
        artifactSha256: hash(artifact),
        split,
        browser: browser.version(),
        headless: false,
        results,
      },
      null,
      2,
    ),
    { flag: "wx" },
  );
} finally {
  await browser.close();
  await new Promise<void>((done) => server.httpServer.close(() => done()));
}
