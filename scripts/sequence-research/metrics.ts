import type { DatasetExample } from "@matchbox-ai/core";
import { tensorPredictor } from "@matchbox-ai/core/internal";
import type { SequenceArtifact } from "@matchbox-ai/core/internal";
import type { SequenceRecipe } from "../../packages/train/src/models/sequence/types.js";

/** Diagnostic token predictions, independent of parser acceptance. */
export async function measure(
  model: SequenceArtifact,
  recipe: SequenceRecipe,
  rows: DatasetExample<unknown>[],
) {
  const predictor = await tensorPredictor(model);
  const matrix = recipe.labels.map(() => recipe.labels.map(() => 0));
  const documents: { correct: number; tokens: number }[] = [];
  let correct = 0;
  let count = 0;
  try {
    for (const row of rows) {
      const beforeCorrect = correct;
      const beforeCount = count;
      const tokens = predictor.sequence(row.input);
      const expected = recipe.annotate(row, tokens);
      for (const [index, token] of tokens.entries()) {
        if (!token.text.trim() || expected[index] === null) {
          continue;
        }
        const actual = recipe.labels.indexOf(expected[index]!);
        const predicted = recipe.labels.indexOf(token.label);
        if (actual < 0 || predicted < 0) {
          throw new Error("Unrecognized evaluation label.");
        }
        matrix[actual]![predicted]!++;
        correct += Number(actual === predicted);
        count++;
      }
      documents.push({ correct: correct - beforeCorrect, tokens: count - beforeCount });
    }
  } finally {
    predictor.dispose();
  }
  const perLabel = recipe.labels.map((label, index) => {
    const tp = matrix[index]![index]!;
    const support = matrix[index]!.reduce((sum, n) => sum + n, 0);
    const predictions = matrix.reduce((sum, row) => sum + row[index]!, 0);
    const denominator = support + predictions;
    return { label, support, predictions, f1: denominator ? (2 * tp) / denominator : 0 };
  });
  return {
    scoredTokens: count,
    accuracy: count ? correct / count : 0,
    perLabel,
    confusion: matrix,
    documents,
  };
}
