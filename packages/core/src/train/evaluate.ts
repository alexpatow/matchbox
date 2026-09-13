import type { DatasetExample } from "../dataset/index.js";
import type { MatchboxParser } from "../runtime/index.js";
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export async function evaluate(
  parser: MatchboxParser<unknown>,
  examples: readonly DatasetExample<unknown>[],
  validate: (value: unknown) => boolean = () => true,
) {
  let correct = 0,
    abstained = 0,
    invalid = 0;
  const failures: { input: string; expected: unknown; actual: unknown; confidence: number }[] = [];
  const bins = [0, 0.25, 0.5, 0.75].map((lower) => ({ lower, count: 0, correct: 0 }));
  for (const example of examples) {
    const result = await parser.parse(example.input);
    if (result.status === "uncertain") abstained++;
    else if (!validate(result.value)) invalid++;
    const matched = canonical(result.value) === canonical(example.output);
    if (matched) correct++;
    else
      failures.push({
        input: example.input,
        expected: example.output,
        actual: result.value,
        confidence: result.confidence,
      });
    const bin = bins[Math.min(3, Math.floor(result.confidence * 4))]!;
    bin.count++;
    if (matched) bin.correct++;
  }
  return {
    examples: examples.length,
    exactAccuracy: correct / examples.length,
    invalidOutputRate: invalid / examples.length,
    abstentionRate: abstained / examples.length,
    confidenceBins: bins,
    failures,
  };
}
