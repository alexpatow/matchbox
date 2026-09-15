import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { runRust as run } from "./rust";
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
