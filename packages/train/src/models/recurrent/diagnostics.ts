import type { DatasetExample } from "@matchbox-ai/core";
import { tensorPredictor } from "@matchbox-ai/core/internal";
import type { RecurrentArtifact } from "@matchbox-ai/core/internal";
import { spanTargets } from "./supervision.js";
import type { RecurrentRecipe } from "./types.js";
/** Prediction agreement is diagnostic, independent of decoder/schema acceptance. */
export async function diagnostics(
  model: RecurrentArtifact,
  examples: readonly DatasetExample<unknown>[],
  recipe: RecurrentRecipe,
) {
  const predictor = await tensorPredictor(model);
  const confusion = recipe.labels.map(() => recipe.labels.map(() => 0));
  let total = 0,
    correct = 0,
    covered = 0,
    coveredCorrect = 0;
  try {
    for (const example of examples) {
      const tokens = predictor.sequence(example.input);
      const targets = spanTargets(example, tokens, recipe);
      tokens.forEach((token, index) => {
        const prediction = recipe.labels.indexOf(token.label);
        recipe.labels.forEach((_, label) => {
          const count = targets[index * recipe.labels.length + label]!;
          confusion[label]![prediction]! += count;
          total += count;
          if (label === prediction) {
            correct += count;
          }
          if (token.confidence >= model.threshold) {
            covered += count;
            if (label === prediction) {
              coveredCorrect += count;
            }
          }
        });
      });
    }
  } finally {
    predictor.dispose();
  }
  return {
    unit: "supervised code points",
    labels: [...recipe.labels],
    confusion,
    total,
    accuracy: total ? correct / total : null,
    confidenceThreshold: model.threshold,
    coverage: total ? covered / total : null,
    coveredAccuracy: covered ? coveredCorrect / covered : null,
  };
}
