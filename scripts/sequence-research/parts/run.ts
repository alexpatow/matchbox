/** Fixed-budget native experiment. This does not produce a public Matchbox artifact. */
import { createHash } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { cpus, totalmem } from "node:os";
import { resolve } from "node:path";

const [prepared, output, architecture] = process.argv.slice(2);
if (!prepared || !output || !["local", "recurrent"].includes(architecture ?? "")) {
  throw new Error("Usage: bun run.ts <prepared> <new-output> <local|recurrent>");
}
const startedAt = new Date().toISOString();
const hash = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const provenance = {
  startedAt,
  revision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  machine: {
    platform: process.platform,
    arch: process.arch,
    cpu: cpus()[0]?.model,
    memoryBytes: totalmem(),
  },
  executableSha256: hash(await readFile("target/release/examples/context-research")),
};
const start = performance.now();
const child = spawn(
  "/usr/bin/time",
  ["-l", "target/release/examples/context-research", prepared, output, architecture!, "8"],
  {
    stdio: ["ignore", "inherit", "pipe"],
  },
);
let resources = "";
child.stderr.on("data", (chunk) => {
  resources += String(chunk);
  process.stderr.write(chunk);
});
const exitCode = await new Promise<number | null>((done, reject) => {
  child.on("error", reject);
  child.on("exit", done);
});
const wallMs = performance.now() - start;
if (exitCode !== 0) {
  throw new Error(`Research trainer exited with ${exitCode}. Preserve the captured log.`);
}
const peakRss = resources.match(/(\d+)\s+maximum resident set size/);
const report = JSON.parse(await readFile(resolve(output, "report.json"), "utf8"));
await writeFile(
  resolve(output, "report.json"),
  JSON.stringify(
    {
      ...report,
      ...provenance,
      finishedAt: new Date().toISOString(),
      processWallMs: wallMs,
      peakResidentBytes: peakRss ? Number(peakRss[1]) : null,
      weightsSha256: hash(await readFile(resolve(output, "weights.bin"))),
    },
    null,
    2,
  ),
);
