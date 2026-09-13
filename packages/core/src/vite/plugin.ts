import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { readSequenceArtifact } from "../runtime/index.js";
/** The Vite/Rollup load hook keeps artifact contents in the module graph for watch and hashing. */
export function matchbox() {
  return {
    name: "matchbox",
    enforce: "pre" as const,
    async load(id: string) {
      if (!id.endsWith(".matchbox")) return null;
      const raw = await readFile(id, "utf8");
      const model = readSequenceArtifact(JSON.parse(raw));
      const task = resolve(dirname(id), model.taskModule).replaceAll("\\", "/");
      const decoder = resolve(dirname(id), model.decoderModule).replaceAll("\\", "/");
      return `import task from ${JSON.stringify(task)};\nimport decode from ${JSON.stringify(decoder)};\nimport { createSequenceParser } from "@matchbox-ai/core/runtime";\nexport default createSequenceParser(${JSON.stringify(model)}, task, decode);`;
    },
  };
}
