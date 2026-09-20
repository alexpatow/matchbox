import { sameOutput } from "./same-output.js";
import type { DatasetExample } from "@matchbox-ai/core";
import type { MatchboxParser } from "@matchbox-ai/core/runtime";
export async function evaluateSequence<Input>(
  parser: MatchboxParser<unknown, Input>,
  examples: readonly DatasetExample<unknown, Input>[],
  validate: (value: unknown) => boolean,
) {
  let exact = 0,
    accepted = 0,
    correctAccepted = 0,
    correctAbstentions = 0;
  let invalidOutputs = 0;
  const failures: { input: Input; expected: unknown; actual: unknown }[] = [];
  for (const row of examples) {
    const result = await parser.parse(row.input);
    const actual = result.status === "ok" ? result.value : null;
    if (result.status === "ok" && !validate(result.value)) {
      invalidOutputs++;
    }
    const correct = sameOutput(actual, row.output);
    if (correct) {
      exact++;
    }
    if (result.status === "ok") {
      accepted++;
      if (correct) {
        correctAccepted++;
      }
    } else if (row.output === null) {
      correctAbstentions++;
    }
    if (!correct) {
      failures.push({ input: row.input, expected: row.output, actual });
    }
  }
  return {
    examples: examples.length,
    invalidOutputRate: invalidOutputs / examples.length,
    exactAccuracy: exact / examples.length,
    accepted,
    acceptedAccuracy: accepted ? correctAccepted / accepted : null,
    abstentionRate: 1 - accepted / examples.length,
    correctAbstentions,
    failures,
  };
}
