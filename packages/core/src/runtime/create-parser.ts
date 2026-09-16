import type { z } from "zod";
import type { ParseResult } from "./types.js";
import type { PartialMatchboxParser, PartialParseOptions, PartialParseResult } from "./partial.js";
import { createRecurrentParser } from "../internal/recurrent/create-parser.js";
import type { ParserDefinition } from "../parser/index.js";
import { readArtifact } from "./artifact.js";
import type { MatchboxParser } from "./types.js";
import { createRecordParser } from "../internal/record/index.js";
import { createSequenceParser } from "../internal/sequence/index.js";
import type { SequenceDecoder } from "../internal/sequence/index.js";

/** The model runtime loads on first parse or explicit load. Call dispose when the parser is no longer needed. */
type Lifecycle = { load(): Promise<void>; dispose(): void };
export function createParser<Output extends z.ZodType>(
  value: { readonly kind: "recurrent-parser" },
  task: ParserDefinition<Output>,
  decode: SequenceDecoder,
): PartialMatchboxParser<z.output<Output>> & Lifecycle;
export function createParser<Output extends z.ZodType>(
  value: unknown,
  task: ParserDefinition<Output>,
  decode?: SequenceDecoder,
): MatchboxParser<z.output<Output>> & Lifecycle;
export function createParser<Output extends z.ZodType>(
  value: unknown,
  task: ParserDefinition<Output>,
  decode?: SequenceDecoder,
) {
  const model = readArtifact(value);
  if (JSON.stringify(model.taskMetadata) !== JSON.stringify(task.toJSON())) {
    throw new Error("The model and task schema differ. Retrain the model.");
  }
  if (model.kind !== "record-parser" && !decode) {
    throw new Error("The sequence artifact requires its explicit decoder.");
  }
  let disposed = false;
  let release: (() => void) | undefined;
  let loading: Promise<MatchboxParser<z.output<Output>>> | undefined;
  const initialize = async () => {
    const { tensorPredictor } = await import("../internal/tensor-predictor.js");
    if (disposed) {
      throw new Error("The parser has been disposed.");
    }
    const predictor = await tensorPredictor(model);
    if (disposed) {
      predictor.dispose();
      throw new Error("The parser has been disposed.");
    }
    release = predictor.dispose;
    if (model.kind === "recurrent-parser") {
      return createRecurrentParser(model, task, decode!, predictor.sequence);
    }
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
  function parse(input: string): Promise<ParseResult<z.output<Output>>>;
  function parse(
    input: string,
    options: PartialParseOptions,
  ): Promise<PartialParseResult<z.output<Output>>>;
  async function parse(
    input: string,
    options?: PartialParseOptions,
  ): Promise<PartialParseResult<z.output<Output>>> {
    const parser = await load();
    if (disposed) {
      throw new Error("The parser has been disposed.");
    }
    if (options?.allowPartial) {
      if (model.kind !== "recurrent-parser") {
        throw new Error("Partial parsing requires a recurrent model.");
      }
      return (parser as PartialMatchboxParser<z.output<Output>>).parse(input, options);
    }
    return parser.parse(input);
  }
  const runtime = {
    async load() {
      await load();
    },
    parse,
    dispose() {
      disposed = true;
      release?.();
      release = undefined;
    },
  };
  if (model.kind === "recurrent-parser") {
    return { ...runtime, supportsPartial: true as const };
  }
  return runtime;
}
