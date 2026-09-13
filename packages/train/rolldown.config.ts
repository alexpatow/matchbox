import { defineConfig } from "rolldown";
export default defineConfig({
  input: { index: "src/index.ts", cli: "src/cli/main.ts" },
  platform: "node",
  external: [/^@matchbox-ai\/core(?:\/|$)/, /^zod(?:\/|$)/, /^@tensorflow\//],
  output: { dir: "dist", format: "esm", sourcemap: true },
});
