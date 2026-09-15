import { runRust } from "./rust";
const manifest = Bun.TOML.parse(
  await Bun.file(new URL("../crates/matchbox-wasm/Cargo.toml", import.meta.url)).text(),
) as { dependencies: { "wasm-bindgen": string } };
const pin = manifest.dependencies["wasm-bindgen"];
if (!/^=\d+\.\d+\.\d+$/.test(pin)) {
  throw new Error("Pin an exact wasm-bindgen version in crates/matchbox-wasm/Cargo.toml.");
}
await runRust(["rustup", "show"]);
await runRust(["cargo", "install", "wasm-bindgen-cli", "--version", pin.slice(1), "--locked"]);
