import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
async function run(args: string[]) {
  const child = Bun.spawn(args, { stdout: "inherit", stderr: "inherit" });
  if (await child.exited) {
    throw new Error(`Rust build failed: ${args.join(" ")}`);
  }
}
await run(["cargo", "build", "--locked", "--release", "-p", "matchbox-node"]);
await run([
  "cargo",
  "build",
  "--locked",
  "--profile",
  "wasm",
  "--target",
  "wasm32-unknown-unknown",
  "-p",
  "matchbox-wasm",
]);
await mkdir("packages/train/native", { recursive: true });
const libraries: Record<string, string> = {
  darwin: "libmatchbox_node.dylib",
  linux: "libmatchbox_node.so",
  win32: "matchbox_node.dll",
};
const library = libraries[process.platform];
if (!library) {
  throw new Error(`Unsupported native platform: ${process.platform}`);
}
await copyFile(resolve("target/release", library), "packages/train/native/matchbox.node");
await run([
  "wasm-bindgen",
  "target/wasm32-unknown-unknown/wasm/matchbox_wasm.wasm",
  "--target",
  "web",
  "--out-dir",
  "packages/core/wasm",
  "--out-name",
  "matchbox_wasm",
]);
