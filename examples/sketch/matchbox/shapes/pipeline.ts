import { definePipeline, featureClassifier } from "@matchbox-ai/train";
export default definePipeline({
  prediction: featureClassifier({ encode: "./encode", threshold: 0.8 }),
  acceptance: { minAccuracy: 0.85, maxBytes: 24000 },
});
