import { readFile } from "node:fs/promises";
import init from "../../../wasm/matchbox_wasm.js";
export async function load(): Promise<void> {
  await init({
    module_or_path: await readFile(new URL("./matchbox_wasm_bg.wasm", import.meta.url)),
  });
}
