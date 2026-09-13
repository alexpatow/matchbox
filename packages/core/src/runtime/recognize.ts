import type { ModelArtifact } from "./artifact.js";
import { vector, words, numbers } from "./features.js";
import type { Predicate } from "./types.js";
export function recognize(
  model: ModelArtifact,
  text: string,
): { value: Predicate | null; confidence: number } {
  const input = vector(text, model.vocabulary);
  const scores = model.weights.map((row) =>
    row.reduce((sum, weight, i) => sum + weight * model.scale * input[i]!, 0),
  );
  const ranked = scores.map((score, index) => ({ score, index })).sort((a, b) => b.score - a.score);
  const best = ranked[0]!;
  const gap = best.score - ranked[1]!.score;
  const known = new Set(model.vocabulary.filter((key) => key.startsWith("w:")));
  const tokens = words(text);
  // Tokens exclusive to a training field flag implicit mixed-field clauses.
  const fields = Object.entries(model.fieldTokens)
    .filter(([, anchors]) => anchors.some((token) => tokens.includes(token)))
    .map(([field]) => field);
  if (fields.length > 1) return { value: null, confidence: 0 };
  const coverage =
    tokens.filter((word) => known.has(`w:${word}`)).length / Math.max(1, tokens.length);
  // A score for abstention, not a calibrated probability of correctness.
  const confidence =
    Math.max(0, Math.min(1, gap / (model.algorithm === "linear" ? 2 : 0.3))) * coverage;
  const template = model.templates[best.index]!;
  const amounts = numbers(text);
  if (
    tokens.some((token) => ["not", "exclude", "except", "without"].includes(token)) &&
    template.predicate.operator !== "neq"
  )
    return { value: null, confidence: 0 };
  if (
    confidence < model.threshold ||
    coverage < 0.75 ||
    amounts.length !== (template.numberSlot ? 1 : 0)
  )
    return { value: null, confidence };
  if (template.numberSlot && (!Number.isFinite(amounts[0]) || amounts[0]! < 0))
    return { value: null, confidence: 0 };
  return {
    value: {
      ...template.predicate,
      value: template.numberSlot ? amounts[0]! : template.predicate.value,
    },
    confidence,
  };
}
