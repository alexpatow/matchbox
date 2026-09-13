import type { RecordArtifact } from "./record/index.js";
import type { SequenceArtifact } from "./sequence/index.js";
export async function tensorPredictor(artifact: RecordArtifact | SequenceArtifact) {
  const runtime = await import("../runtime/tensorflow/index.js");
  return runtime.tensorPredictor(artifact);
}
