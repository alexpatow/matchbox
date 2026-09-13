import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { readArtifact } from "../runtime/index.js";
/** The Vite/Rollup load hook keeps artifact contents in the module graph for watch and hashing. */
export function matchbox() {
  return {
    name: "matchbox",
    enforce: "pre" as const,
    async load(id: string) {
      if (!id.endsWith(".matchbox")) return null;
      const raw = await readFile(id, "utf8");
      const model = readArtifact(JSON.parse(raw));
      const task = resolve(dirname(id), model.taskModule).replaceAll("\\", "/");
      return `import task from ${JSON.stringify(task)};\nimport { createParser } from "@matchbox-ai/core/runtime";\nexport default createParser(${JSON.stringify(model)}, task);`;
    },
  };
}
