import { defineConfig } from "rolldown";
export default defineConfig({
  input: { cli: "src/main.ts" },
  platform: "node",
  external: [
    /^@matchbox-ai\/(core|train)(?:\/|$)/,
    /^zod(?:\/|$)/,

    /^package-manager-detector(?:\/|$)/,
    "commander",
    "ink",
    "@inkjs/ui",
    "react",
    "react/jsx-runtime",
    "vite",
    "open",
  ],
  output: { dir: "dist", format: "esm", sourcemap: true },
});
