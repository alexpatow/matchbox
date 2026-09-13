import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { readArtifact } from "../internal/index.js";
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
      const decoderImport =
        model.decoderModule === null
          ? ""
          : `import decode from ${JSON.stringify(resolve(dirname(id), model.decoderModule).replaceAll("\\", "/"))};\n`;
      return `import task from ${JSON.stringify(task)};\n${decoderImport}import { createParser } from "@matchbox-ai/core/runtime";\nconst parser = createParser(${JSON.stringify(model)}, task${model.decoderModule === null ? "" : ", decode"});\nif (import.meta.hot) import.meta.hot.dispose(() => parser.dispose?.());\nexport default parser;`;
    },
  };
}
