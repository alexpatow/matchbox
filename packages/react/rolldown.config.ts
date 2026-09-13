import { defineConfig } from "rolldown";
export default defineConfig({
  input: "src/index.ts",
  platform: "browser",
  external: [/^@matchbox-ai\/core(?:\/|$)/, /^zod(?:\/|$)/, "react"],
  output: { dir: "dist", format: "esm", sourcemap: true },
});
