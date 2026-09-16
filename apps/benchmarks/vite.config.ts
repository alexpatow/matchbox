import { defineConfig } from "vite";
import { matchbox } from "@matchbox-ai/core/vite";
export default defineConfig({ plugins: [matchbox()] });
