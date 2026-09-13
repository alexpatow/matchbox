import { readSequenceArtifact } from "../internal/sequence/index.js";
import { readRecordArtifact } from "../internal/record/index.js";
export function readArtifact(value: unknown) {
  return value && typeof value === "object" && "kind" in value && value.kind === "record-parser"
    ? readRecordArtifact(value)
    : readSequenceArtifact(value);
}
