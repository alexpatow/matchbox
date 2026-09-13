import { defineConfig } from "rolldown";
export default defineConfig([
  {
    input: {
      index: "src/index.ts",
      "runtime/index": "src/runtime/index.ts",
      "react/index": "src/react/index.ts",
      "internal/index": "src/internal/index.ts",
    },
    platform: "browser",
    external: [/^zod(?:\/|$)/, /^@tensorflow\//, /^react(?:\/|$)/],
    output: { dir: "dist", format: "esm", sourcemap: true },
  },
  {
    input: {
      "vite/index": "src/vite/index.ts",
    },
    platform: "node",
    external: [/^zod(?:\/|$)/, /^@tensorflow\//, /^react(?:\/|$)/],
    output: { dir: "dist", format: "esm", sourcemap: true },
  },
]);
