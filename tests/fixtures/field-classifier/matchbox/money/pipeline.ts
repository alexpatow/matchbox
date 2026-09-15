import { definePipeline, fieldClassifier } from "@matchbox-ai/train";
export default definePipeline({
  prediction: fieldClassifier(),
  acceptance: { minAccuracy: 0.95, maxBytes: 64000 },
});
