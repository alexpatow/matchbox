import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { matchbox } from "@matchbox-ai/core/vite";

import { lexerModel } from "./tooling/lexer-model";
import { documentation } from "./tooling/documentation";

export default defineConfig(async () => ({
  plugins: [await lexerModel(), documentation(), matchbox(), react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: { target: "es2022" },
}));
