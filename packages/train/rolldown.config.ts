import { defineConfig } from "rolldown";
export default defineConfig({
  input: { index: "src/index.ts", cli: "src/cli/main.ts" },
  platform: "node",
  external: [
    /^@matchbox-ai\/core(?:\/|$)/,
    /^zod(?:\/|$)/,
    /^@tensorflow\//,
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
