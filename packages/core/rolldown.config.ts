import { defineConfig } from "rolldown";

export default defineConfig({
  input: "src/index.ts",
  platform: "browser",
  output: {
    file: "dist/index.js",
    format: "esm",
    sourcemap: true,
  },
});
