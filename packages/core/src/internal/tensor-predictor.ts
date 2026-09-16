import type { RecurrentArtifact } from "./recurrent/index.js";
import type { RecordArtifact } from "./record/index.js";
import type { SequenceArtifact } from "./sequence/index.js";
export async function tensorPredictor(
  artifact: RecordArtifact | SequenceArtifact | RecurrentArtifact,
) {
  if (artifact.kind === "recurrent-parser") {
    const { recurrentPredictor } = await import("../runtime/burn/recurrent.js");
    return recurrentPredictor(artifact);
  }
  if (artifact.kind === "sequence-parser") {
    const { burnPredictor } = await import("../runtime/burn/index.js");
    return burnPredictor(artifact);
  }
  const runtime = await import("../runtime/burn/record.js");
  return runtime.recordPredictor(artifact);
}
