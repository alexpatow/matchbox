# Train a model

Training learns from your examples and writes a model you can import into your application. Run these commands from a project where you have already [added a task](getting-started.md).

## Prepare the task

A conventional task needs:

| File                     | Purpose                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `parser.ts`              | Defines valid input and output.                            |
| `pipeline.ts`            | Chooses a learning strategy and export requirements.       |
| `data/train.jsonl`       | Supplies the examples used to fit the model.               |
| `evals/validation.jsonl` | Checks whether the fitted model meets export requirements. |
| `evals/test.jsonl`       | Measures the selected model independently.                 |

[Choose a pipeline](pipelines.md) based on the task. A field classifier learns finite output values. A token classifier also needs a [recipe and decoder](reference/supervision.md) with aligned token annotations.

Write validation and test examples independently of training data. Keep them out of data generators. The loader rejects inputs shared across splits after trimming whitespace and folding case.

## Run training

```sh
bunx matchbox-ai train money
```

For epoch loss, add `--verbose`. For a machine-readable build report, add `--json`.

You can also open `bunx matchbox-ai dev money` and choose **Train model**. Both use the same local training workflow. Your app keeps its own dev server.

## What happens during a run

1. Matchbox validates task configuration, datasets, and any token annotations.
2. The selected strategy fits vocabulary, output domains, and weights from training data.
3. Burn trains the network locally. Matchbox checks the exported model against the native model.
4. Validation accuracy and model size gate packaging.
5. The independent test split is scored and included in the report.

A schema describes valid output. It does not generate training data or choose a numeric representation. Token decoders own explicit conversion and arithmetic.

## Set export requirements

Set acceptance values in `pipeline.ts`:

```ts
acceptance: { minAccuracy: 0.9, maxBytes: 30000 }
```

`minAccuracy` is the required fraction of exact validation matches. `maxBytes` limits serialized model bytes, excluding the runtime and authored decoder. If either gate fails, training exits nonzero without exporting a replacement.

A model may pass validation and perform poorly on the independent test split. That test score is reported after packaging; run [`eval`](evaluation.md) as the separate test gate before shipping.

## Use the artifacts

A successful run writes:

```text
.matchbox/money/
  model.matchbox
  model.ts
  model.d.matchbox.ts
  report.json
```

Import `model.ts` in your app. The wrapper references the matching task and decoder, so keep them together when deploying. Generated artifacts are ignored by Git; train before your app build or restore an evaluated artifact and its matching authored modules.

The report records accuracy, size, loss, export parity, and dataset hashes. It does not measure browser latency. Continue with [Evaluate a model](evaluation.md) to assess the result, uncertainty, and speed.

## Retrain after changes

Edit training examples and, for token models, their annotations. Run training again, then evaluate. Preserve test inputs even when the model gets them wrong.

For programmatic training, see [`train`](reference/training.md). For path overrides, see [configuration](reference/configuration.md).
