import { definePipeline, tokenClassifier } from "@matchbox-ai/train";
export default definePipeline({
  prediction: tokenClassifier({ recipe: "./lib/recipe.ts", decode: "./lib/decode.ts" }),
  acceptance: { minAccuracy: 0.9, maxBytes: 30000 },
});
