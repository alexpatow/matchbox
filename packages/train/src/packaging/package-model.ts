import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { SequenceArtifact, RecordArtifact } from "@matchbox-ai/core/internal";
export async function packageModel(
  output: string,
  model: SequenceArtifact | RecordArtifact,
  report: unknown,
) {
  await mkdir(dirname(output), { recursive: true });
  const declaration = output.replace(/\.matchbox$/, ".d.matchbox.ts");
  if (declaration === output) throw new Error("The output filename must end in .matchbox.");
  const decoderImport =
    model.decoderModule === null
      ? ""
      : `import decode from ${JSON.stringify(model.decoderModule.replace(/\.ts$/, ""))};\n`;
  const taskImport = model.taskModule.replace(/\.ts$/, "");
  await writeFile(output, JSON.stringify(model));
  await writeFile(
    declaration,
    `import task from ${JSON.stringify(taskImport)};\nimport type { InferOutput } from "@matchbox-ai/core";\nimport type { MatchboxParser } from "@matchbox-ai/core/runtime";\ndeclare const parser: MatchboxParser<InferOutput<typeof task>> & { load(): Promise<void>; dispose(): void };\nexport default parser;\n`,
  );
  await writeFile(resolve(dirname(output), "report.json"), JSON.stringify(report, null, 2) + "\n");
  // A portable wrapper for bundlers without the Vite plugin; inference still remains local.
  await writeFile(
    output.replace(/\.matchbox$/, ".ts"),
    `import task from ${JSON.stringify(taskImport)};\n${decoderImport}import { createParser } from "@matchbox-ai/core/runtime";\nconst model = ${JSON.stringify(model)};\nexport default createParser(model, task${model.decoderModule === null ? "" : ", decode"});\n`,
  );
}
