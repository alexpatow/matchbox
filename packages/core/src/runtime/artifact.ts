import type { z } from "zod";
import type { ParserDefinition } from "../parser/index.js";
import { readSequenceArtifact, createSequenceParser } from "../sequence/index.js";
import type { SequenceDecoder } from "../sequence/index.js";
import { readRecordArtifact, createRecordParser } from "../record/index.js";
export function readArtifact(value: unknown) {
  return value && typeof value === "object" && "kind" in value && value.kind === "record-parser"
    ? readRecordArtifact(value)
    : readSequenceArtifact(value);
}
export function createParser<Output extends z.ZodType>(
  value: unknown,
  task: ParserDefinition<Output>,
  decode?: SequenceDecoder,
) {
  const model = readArtifact(value);
  if (model.kind === "record-parser") return createRecordParser(model, task);
  if (!decode) throw new Error("The sequence artifact requires its explicit decoder.");
  return createSequenceParser(model, task, decode);
}
