import { definePipeline, tokenClassifier } from "@matchbox-ai/train";
export default definePipeline({
  prediction: tokenClassifier(),
  acceptance: { minAccuracy: 0.85, maxBytes: 24000 },
});
