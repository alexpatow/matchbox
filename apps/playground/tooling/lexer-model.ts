import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { Plugin } from "vite";
import manifest from "../src/lexer/model-manifest.json";

export async function lexerModel(): Promise<Plugin> {
  const directory = new URL("../../../.matchbox/website/", import.meta.url);
  const cache = new URL(`${manifest.sha256}.matchbox`, directory);
  let bytes: Uint8Array;
  try {
    bytes = await readFile(cache);
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
      throw error;
    }
    const response = await fetch(manifest.url);
    if (!response.ok) {
      throw new Error(`Lexer artifact download failed: ${response.status}`);
    }
    bytes = new Uint8Array(await response.arrayBuffer());
  }
  if (
    bytes.length !== manifest.bytes ||
    createHash("sha256").update(bytes).digest("hex") !== manifest.sha256
  ) {
    throw new Error("Lexer artifact checksum mismatch. Refusing to serve unverified weights.");
  }
  await mkdir(directory, { recursive: true });
  await writeFile(cache, bytes);
  return {
    name: "matchbox-lexer-demo-model",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "models/lexer.matchbox", source: bytes });
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split("?")[0] !== "/models/lexer.matchbox") {
          next();
          return;
        }
        response.setHeader("Content-Type", "application/json");
        response.end(bytes);
      });
    },
  };
}
