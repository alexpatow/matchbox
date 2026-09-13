import { clauseFeatures } from "@matchbox-ai/core/runtime";
import type { ModelArtifact, Predicate, Template } from "@matchbox-ai/core/runtime";
import type { DatasetExample } from "@matchbox-ai/core";

export function fit(
  examples: readonly DatasetExample<Predicate>[],
  algorithm: ModelArtifact["algorithm"],
): Pick<
  ModelArtifact,
  "vocabulary" | "templates" | "weights" | "scale" | "algorithm" | "fieldTokens"
> {
  const vocabulary = [
    ...new Set(examples.flatMap((row) => clauseFeatures.features(row.input))),
  ].sort();
  const tokenFields = new Map<string, Set<string>>();
  for (const example of examples)
    for (const token of clauseFeatures.words(example.input)) {
      const fields = tokenFields.get(token) ?? new Set<string>();
      fields.add(example.output.field);
      tokenFields.set(token, fields);
    }
  const fieldTokens: Record<string, string[]> = Object.fromEntries(
    [...new Set(examples.map((row) => row.output.field))].map((field) => [field, []]),
  );
  for (const [token, fields] of tokenFields)
    if (fields.size === 1) fieldTokens[[...fields][0]!]!.push(token);
  const templates: Template[] = [];
  const keys: string[] = [];
  const labels = examples.map((row) => {
    const numberSlot = typeof row.output.value === "number";
    if (
      numberSlot &&
      (clauseFeatures.numbers(row.input).length !== 1 ||
        clauseFeatures.numbers(row.input)[0] !== row.output.value)
    )
      throw new Error(`Training amount must match one numeric input span: ${row.input}`);
    const predicate = {
      field: row.output.field,
      operator: row.output.operator,
      value: numberSlot ? 0 : row.output.value,
    };
    const key = JSON.stringify({ predicate, numberSlot });
    let index = keys.indexOf(key);
    if (index === -1) {
      index = keys.length;
      keys.push(key);
      templates.push({ predicate, numberSlot });
    }
    return index;
  });
  if (templates.length < 2) throw new Error("Training needs at least two clause classes.");
  const inputs = examples.map((row) => clauseFeatures.vector(row.input, vocabulary));
  const weights = templates.map(() => vocabulary.map(() => 0));
  if (algorithm === "centroid") {
    inputs.forEach((input, row) =>
      input.forEach((value, column) => {
        weights[labels[row]!]![column]! += value;
      }),
    );
    for (const row of weights) {
      const norm = Math.sqrt(row.reduce((sum, value) => sum + value * value, 0)) || 1;
      row.forEach((value, i) => {
        row[i] = value / norm;
      });
    }
  } else {
    // Full-batch softmax regression from zero initialization is deterministic.
    for (let epoch = 0; epoch < 300; epoch++) {
      const gradient = weights.map((row) => row.map(() => 0));
      inputs.forEach((input, row) => {
        const scores = weights.map((weight) =>
          weight.reduce((sum, value, j) => sum + value * input[j]!, 0),
        );
        const maximum = Math.max(...scores);
        const exp = scores.map((score) => Math.exp(score - maximum));
        const total = exp.reduce((sum, value) => sum + value, 0);
        exp.forEach((value, label) => {
          const error = value / total - (label === labels[row] ? 1 : 0);
          input.forEach((feature, column) => {
            gradient[label]![column]! += (error * feature) / inputs.length;
          });
        });
      });
      weights.forEach((row, label) =>
        row.forEach((weight, column) => {
          row[column] = weight - 4 * (gradient[label]![column]! + 0.0001 * weight);
        }),
      );
    }
  }
  const scale = Math.max(...weights.flat().map(Math.abs)) / 127 || 1;
  return {
    algorithm,
    vocabulary,
    fieldTokens,
    templates,
    scale,
    weights: weights.map((row) => row.map((value) => Math.round(value / scale))),
  };
}
