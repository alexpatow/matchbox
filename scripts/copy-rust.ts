import { copyFile } from "node:fs/promises";
await copyFile("wasm/matchbox_wasm_bg.wasm", "dist/matchbox_wasm_bg.wasm");
await copyFile("wasm/matchbox_webgpu_bg.wasm", "dist/matchbox_webgpu_bg.wasm");
