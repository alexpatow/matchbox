import { runRust as run } from "./rust";
await run(["node", "scripts/build-native.ts"]);
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
await import("./build-webgpu");
