# Evaluate a model

Evaluate the saved artifact without updating its weights:

```sh
bunx matchbox-ai eval money
bunx matchbox-ai eval money --json
```

This scores `evals/test.jsonl` and exits `1` when exact accuracy is below `minAccuracy`. It needs the artifact and task modules, but not the training dataset. The workbench's **Evaluate** action uses the same test gate.

## Read the results

| Metric              | Meaning                                                                      |
| ------------------- | ---------------------------------------------------------------------------- |
| Exact accuracy      | Fraction of complete outputs matching the expected value.                    |
| Accepted accuracy   | Accuracy among returned answers; `null` when none were returned.             |
| Abstention rate     | Fraction of inputs for which the parser declined to answer.                  |
| Invalid-output rate | Fraction of evaluated inputs yielding an accepted but schema-invalid answer. |
| Failures            | Expected and actual values for mismatches. Uncertainty appears as `null`.    |

Read accuracy and abstention together. High accepted accuracy can hide poor coverage. Schema validity checks shape, not meaning; confidence is uncalibrated.

Keep validation and test inputs separate from training. Test new compositions, not only paraphrases or different numbers with the same token representation. The [evaluation API](reference/evaluation.md) returns these metrics without enforcing an acceptance gate.

## Test uncertainty

For token models, add negative cases in `evals/challenges.json`:

```json
[{ "input": "sometime soon", "output": null }]
```

Training scores these separately under `challenges`; they do not select the model. CLI `eval` does not rerun this file and requires test outputs to satisfy the task schema. Use the programmatic evaluator to score expected `null` as abstention regardless of the successful output schema.

## Evaluate partial results

Recurrent reports include code-point agreement, confidence coverage and agreement within that coverage. These diagnostics bypass whole-result acceptance and are separate from exact parser accuracy.

CLI evaluation uses strict CPU parsing. For previews, evaluate `parse(input, { allowPartial: true })` in your own loop. Record `ok`, `partial` and `uncertain` separately, along with candidate agreement and uncertain-range coverage. See the [partial-result contract](reference/runtime.md#partialmatchboxparser).

## Measure browser speed

The workbench's **Measure browser speed** action uses the current input, 20 warmups and 100 timed CPU predictions. The website measures the filter, money and time examples automatically with 20 warmups and 300 timed predictions. These measurements include output validation and exclude loading and rendering.

Record the input, browser and device. Measure cold initialization and downloaded assets separately. For recurrent models, compare explicit CPU and GPU calls on representative inputs; see [runtime execution](runtime-backends.md).

## Audit repository examples

After `bun run train`, run `bun run eval:examples`. It writes `.matchbox/example-evaluation.json` with mismatches, slice metrics, false accepts, hashes and token overlap against training. Each example owns a frozen `evals/generalization.json`.

Word tokenization maps numbers to `<number>`, so changing 15 to 90 tests copying and arithmetic, not learned numerical generalization. Report feature-novel inputs separately. Keep the frozen audit cases independent of model development. See [example results](example-evaluation.md).
