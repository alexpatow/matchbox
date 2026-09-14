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

## Measure browser speed

Use **Measure browser speed** in the workbench or the benchmark controls on the examples page. They run inference through TensorFlow.js CPU on the current device, including output validation.

These measurements exclude model loading and UI rendering. Record the input, sample count, browser, and device with the result. The workbench uses 100 timed runs after 20 warmups; the website demo uses 300 timed runs after 20 warmups. Repeated-input latency is separate from held-out accuracy.

See the [evaluation API](reference/evaluation.md) for exact metric fields and return types.

## Repository example audit

After `bun run train`, run `bun run eval:examples`. It writes `.matchbox/example-evaluation.json` with all predictions that disagree with expected outputs, slice metrics, false accepts, source hashes, and token-sequence overlap with training. Each example owns a frozen `evals/generalization.json` file. Treat those files as audit data; create new development fixtures when fixing failures and obtain a fresh independent evaluation before claiming improvement.

A held-out string can still be identical to training at the model's input representation. Word tokenization maps all numbers to `<number>`. Changing 15 to 90 tests deterministic copying and arithmetic, not learned numerical generalization. Report accuracy on feature-novel inputs separately.

The audit evaluates model outputs against the task’s expected results. Positive coverage, accuracy among accepted answers, and false acceptance of negative examples matter alongside exact match. A high abstention rate can hide an ineffective parser. Threshold curves are diagnostics, not permission to pick a threshold on test data.

See [the measured example audit](example-evaluation.md) for current results and limitations.
