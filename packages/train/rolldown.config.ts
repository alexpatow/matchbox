import { defineConfig } from "rolldown";
export default defineConfig({
  input: { index: "src/index.ts", cli: "src/cli.ts" },
  platform: "node",
  external: [/^@matchbox-ai\/core(?:\/|$)/, /^zod(?:\/|$)/, "react"],
  output: { dir: "dist", format: "esm", sourcemap: true },
});
