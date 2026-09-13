import { defineConfig } from "rolldown";
export default defineConfig([
  {
    input: {
      index: "src/index.ts",
      "runtime/index": "src/runtime/index.ts",
      "react/index": "src/react/index.ts",
    },
    platform: "browser",
    external: [/^zod(?:\/|$)/, "react"],
    output: { dir: "dist", format: "esm", sourcemap: true },
  },
  {
    input: {
      "vite/index": "src/vite/index.ts",
      "train/index": "src/train/index.ts",
      "train/cli": "src/train/cli.ts",
    },
    platform: "node",
    external: [/^zod(?:\/|$)/, "react"],
    output: { dir: "dist", format: "esm", sourcemap: true },
  },
]);
