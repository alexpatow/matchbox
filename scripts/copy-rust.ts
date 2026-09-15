import { copyFile } from "node:fs/promises";
if (process.argv[2] === "core") {
  await copyFile("wasm/matchbox_wasm_bg.wasm", "dist/matchbox_wasm_bg.wasm");
} else {
  await copyFile("native/matchbox.node", "dist/matchbox.node");
}
