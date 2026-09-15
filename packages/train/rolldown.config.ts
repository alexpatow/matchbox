import { defineConfig } from "rolldown";
export default defineConfig({
  input: { index: "src/index.ts", "project/index": "src/project/index.ts" },
  platform: "node",
  external: [/^@matchbox-ai\/core(?:\/|$)/, /^zod(?:\/|$)/],
  output: { dir: "dist", format: "esm", sourcemap: true },
});
