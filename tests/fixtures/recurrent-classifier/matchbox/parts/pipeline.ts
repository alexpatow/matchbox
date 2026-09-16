import { definePipeline, recurrentTokenClassifier } from "@matchbox-ai/train";
// This fixture exercises integration, not a meaningful application-quality benchmark.
export default definePipeline({
  prediction: recurrentTokenClassifier({ epochs: 20 }),
  acceptance: { minAccuracy: 0, maxBytes: 250000 },
});
