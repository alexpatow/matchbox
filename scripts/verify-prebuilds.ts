import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
const targets = JSON.parse(
  readFileSync(new URL("./native-targets.json", import.meta.url), "utf8"),
) as {
  platform: string;
  arch: string;
  file: string;
}[];
const root = resolve(process.argv[2] ?? "packages/train");
for (const target of targets) {
  const path = resolve(root, "prebuilds", `${target.platform}-${target.arch}`, target.file);
  if (statSync(path).size === 0) {
    throw new Error(`Empty prebuild: ${path}`);
  }
}
console.log(`Verified all ${targets.length} native prebuilds in ${root}.`);
