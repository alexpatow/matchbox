export function print(value: unknown, json = false) {
  if (json) {
    console.log(JSON.stringify(value, null, 2));
    return;
  }
  console.log(JSON.stringify(value, null, 2));
}
export function metrics(value: {
  examples: number;
  exactAccuracy: number;
  abstentionRate: number;
  invalidOutputRate: number;
  failures: { input: string; expected: unknown; actual: unknown }[];
}) {
  console.log(
    `  Exact match   ${(value.exactAccuracy * 100).toFixed(1)}% across ${value.examples} examples`,
  );
  console.log(`  Abstained     ${(value.abstentionRate * 100).toFixed(1)}%`);
  console.log(`  Invalid       ${(value.invalidOutputRate * 100).toFixed(1)}%`);
  for (const failure of value.failures.slice(0, 10)) {
    console.log(
      `\n  ${failure.input}\n    Expected: ${JSON.stringify(failure.expected)}\n    Actual:   ${JSON.stringify(failure.actual)}`,
    );
  }
  if (value.failures.length > 10) {
    console.log(`  ${value.failures.length - 10} more failures. Use --json for all results.`);
  }
}
