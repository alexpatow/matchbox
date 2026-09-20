import type { z } from "zod";
import type { ParserDefinition } from "../parser/types.js";
import type { NumericEncoder } from "../parser/numeric-encoder.js";
import type { SequenceDecoder } from "../internal/sequence/index.js";
import type { MatchboxParser } from "./types.js";
import type { PartialMatchboxParser } from "./partial.js";
import { readArtifact } from "./artifact.js";
import { createFeatureParser } from "../internal/features/index.js";
import { createTextParser } from "./create-text-parser.js";
type Lifecycle = { load(): Promise<void>; dispose(): void };
export function createParser<Output extends z.ZodType>(
  value: { readonly kind: "recurrent-parser" },
  task: ParserDefinition<Output>,
  decode: SequenceDecoder,
): PartialMatchboxParser<z.output<Output>> & Lifecycle;
export function createParser<Output extends z.ZodType, Input extends z.ZodType>(
  value: unknown,
  task: ParserDefinition<Output, Input>,
  encode: NumericEncoder<z.output<Input>>,
): MatchboxParser<z.output<Output>, z.input<Input>> & Lifecycle;
export function createParser<Output extends z.ZodType>(
  value: unknown,
  task: ParserDefinition<Output>,
  decode?: SequenceDecoder,
): MatchboxParser<z.output<Output>> & Lifecycle;
export function createParser<Output extends z.ZodType, Input extends z.ZodType>(
  value: unknown,
  task: ParserDefinition<Output, Input>,
  adapter?: SequenceDecoder | NumericEncoder<z.output<Input>>,
) {
  const model = readArtifact(value);
  if (JSON.stringify(model.taskMetadata) !== JSON.stringify(task.toJSON())) {
    throw new Error("The model and task schema differ. Retrain the model.");
  }
  if (model.kind === "feature-parser") {
    if (!adapter || typeof adapter === "function") {
      throw new Error("The feature artifact requires its explicit numeric encoder.");
    }
    return createFeatureParser(model, task, adapter);
  }
  if (task.toJSON().input.type !== "string" || (adapter && typeof adapter !== "function")) {
    throw new Error(
      "Text classifiers require string input. Use featureClassifier with an explicit encoder for structured input.",
    );
  }
  return createTextParser(model, task as unknown as ParserDefinition<Output>, adapter);
}
