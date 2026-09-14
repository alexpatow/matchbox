# Evaluate a model

Evaluation checks an existing model against inputs with known answers. It does not update weights or train on your test data.

## Run the test split

After [training](training.md), run:

```sh
bunx matchbox-ai eval money
bunx matchbox-ai eval money --json
```

This loads the saved artifact and scores `evals/test.jsonl`. It does not require the training dataset. The command exits `1` when exact accuracy is below the configured `minAccuracy`, making it suitable for a CI gate.

The workbench's **Evaluate** action runs the same test evaluation. The programmatic [`evaluate`](reference/evaluation.md) API returns metrics without applying an acceptance gate.

## Keep the splits separate

| Split                    | Used for                                                               |
| ------------------------ | ---------------------------------------------------------------------- |
| `data/train.jsonl`       | Learning vocabulary, output domains, and weights.                      |
| `evals/validation.jsonl` | Checking accuracy and size requirements before exporting a candidate.  |
| `evals/test.jsonl`       | Measuring the selected model without influencing fitting or selection. |

Withhold meaningful input compositions and complete output values where the chosen strategy supports unseen values. Avoid near-duplicate paraphrases across splits. A low test score should lead to better training coverage or a different explicit pipeline, not edited test answers.

## Read the results

| Metric              | Meaning                                                                             |
| ------------------- | ----------------------------------------------------------------------------------- |
| Exact accuracy      | The fraction of complete outputs matching the expected value.                       |
| Accepted accuracy   | Accuracy among answers the parser returned; `null` when it returned none.           |
| Abstention rate     | The fraction of inputs on which the parser declined to answer.                      |
| Invalid-output rate | The fraction of returned answers that fail output validation.                       |
| Failures            | Inputs with their expected output and actual result. Uncertainty appears as `null`. |

Read accuracy and abstention together. A model that answers only easy inputs can have high accepted accuracy and poor coverage. Schema validity guarantees an output's shape, not that its meaning is correct.

## Test uncertainty

Confidence is an uncalibrated model score. Zero confidence means the current model declined to answer; it does not establish that the input is invalid or that training coverage is the only problem.

For sequence models, add negative cases in `evals/challenges.json`:

```json
[{ "input": "sometime soon", "output": null }]
```

Training includes these in the report's separate `challenges` section. They do not become training examples or select the model. The CLI `eval` command scores the configured test split; it does not automatically rerun the challenge file.

The programmatic evaluator also accepts expected `null` for abstention cases. This is an evaluation convention, not a change to the task's successful output schema.

## Compare a baseline

An optional `evals/baseline.ts` default-exports a parser with the same `parse(input)` result contract. Training scores it on the same test split and records the result under `baseline`.

Compare the learned model against a reasonable deterministic implementation. Report dataset size and coverage alongside accuracy. A small synthetic fixture does not establish general language understanding.

## Measure browser speed

Use **Measure browser speed** in the workbench or the benchmark controls on the examples page. They run inference through TensorFlow.js CPU on the current device, including output validation.

These measurements exclude model loading and UI rendering. Record the input, sample count, browser, and device with the result. The workbench uses 100 timed runs after 20 warmups; the website demo uses 300 timed runs after 20 warmups. Repeated-input latency is separate from held-out accuracy.

See the [evaluation API](reference/evaluation.md) for exact metric fields and return types.
