# Training API

Import these APIs in Node/Bun tooling, outside browser entry points.

## train

```ts
import { train } from "@matchbox-ai/train";
const result = await train("money", {
  onProgress(epoch, loss) {
    console.log(epoch, loss);
  },
});
```

`train(target: string, options?: { onProgress?: (epoch: number, loss: number) => void })` resolves a task and returns a promise for `{ report, output }`. `output` is the packaged artifact path.

It validates the datasets and supervision, trains with native TensorFlow, checks validation accuracy and artifact size, then packages. Configuration, annotation, schema, validation-gate, or size failures reject the promise. A low independent test score is reported after selection and does not undo a model that passed validation. Run CLI `eval` as a separate test gate.

The report contains `architecture`, `backend`, `seed`, `bytes`, `parameters`, `artifactSha256`, `datasetSha256`, split counts in `examples`, `loss`, `exportParity`, `trainingMs`, and evaluation results for `validation`, `quantized`, `float`, `untrained`, and `untrainedUngated`. Sequence reports additionally include `supervisedTokens`, `challenges`, and an optional shuffled-label control. These are measured build results, not browser latency.

## TrainingConfig

`TrainingConfig` is the optional task configuration type. See [every field and default](configuration.md).

Use [evaluate](evaluation.md) to score an existing parser without training it.
