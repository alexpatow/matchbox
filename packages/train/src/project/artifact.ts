import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createParser } from "@matchbox-ai/core/runtime";
import { readArtifact, tensorPredictor } from "@matchbox-ai/core/internal";
import type { SequenceDecoder } from "@matchbox-ai/core/runtime";
import type { ParserDefinition } from "@matchbox-ai/core";
import type { z } from "zod";
import { loadConfig } from "./config.js";
export async function loadArtifact(configPath: string) {
  const { config, root } = await loadConfig(configPath);
  const output = resolve(root, config.output);
  const text = await readFile(output, "utf8").catch(() => {
    throw new Error(`No readable model at ${output}. Run matchbox-ai train first.`);
  });
  const artifact = readArtifact(JSON.parse(text));
  const task: ParserDefinition<z.ZodType> = (
    await import(pathToFileURL(resolve(dirname(output), artifact.taskModule)).href)
  ).default;
  const decode: SequenceDecoder | undefined =
    artifact.decoderModule === null
      ? undefined
      : (await import(pathToFileURL(resolve(dirname(output), artifact.decoderModule)).href))
          .default;
  return {
    artifact,
    task,
    decode,
    parser: createParser(artifact, task, decode),
    inspect: async (input: string) => {
      const predictor = await tensorPredictor(artifact);
      try {
        if (artifact.kind === "record-parser") {
          return predictor.record(input);
        }
        const tokens = predictor.sequence(input);
        return { tokens, candidate: decode!(tokens, input) };
      } finally {
        predictor.dispose();
      }
    },
    output,
    config,
    root,
  };
}
