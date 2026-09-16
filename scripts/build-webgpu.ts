import { runRust as run } from "./rust";
await run([
  "cargo",
  "build",
  "--locked",
  "--profile",
  "wasm",
  "--target",
  "wasm32-unknown-unknown",
  "-p",
  "matchbox-webgpu",
]);
await run([
  "wasm-bindgen",
  "target/wasm32-unknown-unknown/wasm/matchbox_webgpu.wasm",
  "--target",
  "web",
  "--out-dir",
  "packages/core/wasm",
  "--out-name",
  "matchbox_webgpu",
]);
