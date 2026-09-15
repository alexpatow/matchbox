import { definePipeline, fieldClassifier } from "@matchbox-ai/train";
// This explicit starter classifies known field values using word features.
// Choose different documented primitives if your task needs another representation.
export default definePipeline({
  prediction: fieldClassifier(),
});
