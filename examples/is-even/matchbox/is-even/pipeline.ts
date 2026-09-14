import { definePipeline, tokenClassifier } from "@matchbox-ai/train";
export default definePipeline({
  prediction: tokenClassifier(),
  acceptance: { minAccuracy: 1, maxBytes: 24000 },
});
