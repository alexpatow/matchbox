# Train a model

After [adding a task](getting-started.md), supply three independent datasets:

| File                     | Purpose                                      |
| ------------------------ | -------------------------------------------- |
| `data/train.jsonl`       | Fit the model.                               |
| `evals/validation.jsonl` | Select and validate the model before export. |
| `evals/test.jsonl`       | Measure the selected model.                  |

The loader rejects inputs shared across splits after trimming whitespace and folding case. Keep evals out of training-data generators. See [dataset format](dataset-format.md) for row validation.

## Run training

```sh
bunx matchbox-ai train money
```

Add `--verbose` for epoch loss or `--json` for the build report. The workbench's **Train model** action runs the same workflow.

1. Matchbox validates the task, datasets and supervision.
2. The [pipeline](pipelines.md) prepares features and trains with native Burn.
3. Export checks compare native and WASM predictions. Recurrent models select a checkpoint using validation code-point agreement.
4. Validation exact accuracy and artifact size gate export.
5. The test split is scored, then the artifact and report are written.

## Set export requirements

In `pipeline.ts`:

```ts
import { definePipeline, tokenClassifier } from "@matchbox-ai/train";

export default definePipeline({
  prediction: tokenClassifier(),
  acceptance: { minAccuracy: 0.9, maxBytes: 30000 },
});
```

`minAccuracy` is the fraction of complete validation outputs that must match. `maxBytes` limits serialized model bytes, excluding the runtime and decoder. Failure exits nonzero without replacing the previous artifact.

A low test score is reported but does not block packaging. Run [`eval`](evaluation.md) as a separate test gate before shipping.

## Use the artifacts

```text
.matchbox/money/
  model.matchbox
  model.ts
  model.d.matchbox.ts
  report.json
```

Import `model.ts` in your app. Its references to the authored parser and decoder must remain valid. Train before your app build or restore these files together.

The report includes accuracy, model size, loss, training duration and dataset hashes. It does not measure browser latency. See [evaluation](evaluation.md) for quality and timing, or the [training API](reference/training.md) for programmatic use and report fields.
