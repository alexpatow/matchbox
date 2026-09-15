import type { RecordArtifact } from "./record/index.js";
import type { SequenceArtifact } from "./sequence/index.js";
export async function tensorPredictor(artifact: RecordArtifact | SequenceArtifact) {
  if (artifact.kind === "sequence-parser") {
    const { burnPredictor } = await import("../runtime/burn/index.js");
    return burnPredictor(artifact);
  }
  const runtime = await import("../runtime/tensorflow/index.js");
  return runtime.tensorPredictor(artifact);
}
