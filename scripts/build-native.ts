import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
const targets = JSON.parse(
  readFileSync(new URL("./native-targets.json", import.meta.url), "utf8"),
) as {
  id: string;
  target: string;
  platform: string;
  arch: string;
  file: string;
}[];
const musl = process.platform === "linux" && existsSync("/etc/alpine-release");
const selected = targets.find((entry) =>
  process.argv[2]
    ? entry.id === process.argv[2]
    : entry.platform === process.platform &&
      entry.arch === process.arch &&
      entry.id.endsWith("musl") === musl,
);
if (!selected) {
  throw new Error(
    `Unsupported native target: ${process.argv[2] ?? `${process.platform}-${process.arch}`}`,
  );
}
const env = { ...process.env };
if (selected.id.endsWith("musl")) {
  env.RUSTFLAGS = `${env.RUSTFLAGS ?? ""} -C target-feature=-crt-static`;
  env[`CARGO_TARGET_${selected.target.toUpperCase().replaceAll("-", "_")}_LINKER`] = "musl-gcc";
}
execFileSync("rustup", ["target", "add", selected.target], { stdio: "inherit", env });
execFileSync(
  "cargo",
  ["build", "--locked", "--release", "-p", "matchbox-node", "--target", selected.target],
  { stdio: "inherit", env },
);
const libraries: Record<string, string> = {
  darwin: "libmatchbox_node.dylib",
  linux: "libmatchbox_node.so",
  win32: "matchbox_node.dll",
};
const output = resolve(
  "packages/train/prebuilds",
  `${selected.platform}-${selected.arch}`,
  selected.file,
);
mkdirSync(dirname(output), { recursive: true });
copyFileSync(resolve("target", selected.target, "release", libraries[selected.platform]!), output);
console.log(`Prepared ${selected.id}: ${output}`);
