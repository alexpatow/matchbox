import { definePipeline, wordTokens, fieldClassifier } from "@matchbox-ai/train";
export default definePipeline({
  input: wordTokens(),
  prediction: fieldClassifier(),
  acceptance: { minAccuracy: 0.95, maxBytes: 64000 },
});
