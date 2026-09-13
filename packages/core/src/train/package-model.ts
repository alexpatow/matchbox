import { mkdir, writeFile } from "node:fs/promises";
import { dirname, basename } from "node:path";
import type { ModelArtifact } from "../runtime/index.js";
export async function packageModel(output: string, model: ModelArtifact, report: unknown) {
  await mkdir(dirname(output), { recursive: true });
  const declaration = output.replace(/\.matchbox$/, ".d.matchbox.ts");
  if (declaration === output) throw new Error("The output filename must end in .matchbox.");
  const taskImport = model.taskModule.replace(/\.ts$/, ".js");
  await writeFile(output, JSON.stringify(model));
  await writeFile(
    declaration,
    `import task from ${JSON.stringify(taskImport)};\nimport type { InferOutput } from "@matchbox-ai/core";\nimport type { MatchboxParser } from "@matchbox-ai/core/runtime";\ndeclare const parser: MatchboxParser<InferOutput<typeof task>>;\nexport default parser;\n`,
  );
  await writeFile(`${output}.report.json`, JSON.stringify(report, null, 2) + "\n");
  // A portable wrapper for bundlers without the Vite plugin; inference still remains local.
  await writeFile(
    output.replace(/\.matchbox$/, ".ts"),
    `import task from ${JSON.stringify(taskImport)};\nimport { createParser } from "@matchbox-ai/core/runtime";\nconst model = ${JSON.stringify(model)};\nexport default createParser(model, task);\n`,
  );
  console.log(
    `Wrote ${basename(output)}, declarations, a TypeScript wrapper, and the evaluation report.`,
  );
}
