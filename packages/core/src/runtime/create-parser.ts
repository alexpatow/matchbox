import type { z } from "zod";
import type { ParserDefinition } from "../parser/index.js";
import { readArtifact } from "./artifact.js";
import type { MatchboxParser } from "./types.js";
import { createRecordParser } from "../internal/record/index.js";
import { createSequenceParser } from "../internal/sequence/index.js";
import type { SequenceDecoder } from "../internal/sequence/index.js";

/** TensorFlow loads on first parse or explicit load. Call dispose when the parser is no longer needed. */
export function createParser<Output extends z.ZodType>(
  value: unknown,
  task: ParserDefinition<Output>,
  decode?: SequenceDecoder,
): MatchboxParser<z.output<Output>> & { load(): Promise<void>; dispose(): void } {
  const model = readArtifact(value);
  if (JSON.stringify(model.taskMetadata) !== JSON.stringify(task.toJSON())) {
    throw new Error("The model and task schema differ. Retrain the model.");
  }
  if (model.kind === "sequence-parser" && !decode) {
    throw new Error("The sequence artifact requires its explicit decoder.");
  }
  let disposed = false;
  let release: (() => void) | undefined;
  let loading: Promise<MatchboxParser<z.output<Output>>> | undefined;
  const initialize = async () => {
    const { tensorPredictor } = await import("./tensorflow/index.js");
    if (disposed) {
      throw new Error("The parser has been disposed.");
    }
    const predictor = await tensorPredictor(model);
    if (disposed) {
      predictor.dispose();
      throw new Error("The parser has been disposed.");
    }
    release = predictor.dispose;
    return model.kind === "record-parser"
      ? createRecordParser(model, task, predictor.record)
      : createSequenceParser(model, task, decode!, predictor.sequence);
  };
  const load = async () => {
    if (disposed) {
      throw new Error("The parser has been disposed.");
    }
    loading ??= initialize().catch((error: unknown) => {
      loading = undefined;
      throw error;
    });
    const parser = await loading;
    if (disposed) {
      throw new Error("The parser has been disposed.");
    }
    return parser;
  };
  return {
    async load() {
      await load();
    },
    async parse(input) {
      const parser = await load();
      const { prepareCpu } = await import("./tensorflow/index.js");
      await prepareCpu();
      if (disposed) {
        throw new Error("The parser has been disposed.");
      }
      return parser.parse(input);
    },
    dispose() {
      disposed = true;
      release?.();
      release = undefined;
    },
  };
}
