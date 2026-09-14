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

## evaluate

```ts
import { evaluate } from "@matchbox-ai/train";
const metrics = await evaluate(parser, examples, (value) => task.validateOutput(value).success);
```

Arguments are a `MatchboxParser<unknown>`, nonempty `readonly DatasetExample<unknown>[]`, and `(value: unknown) => boolean` for output validation. It returns a promise for the metrics below. It does not train, select thresholds, dispose the parser, or enforce an acceptance gate. Caller errors and parser rejections propagate. Pass a nonempty set; empty input currently produces non-finite ratio metrics.

| Field                | Meaning                                                                        |
| -------------------- | ------------------------------------------------------------------------------ |
| `examples`           | Number evaluated.                                                              |
| `exactAccuracy`      | Fraction whose complete output matches.                                        |
| `invalidOutputRate`  | Fraction of accepted outputs failing the supplied validator.                   |
| `accepted`           | Count returning `status: "ok"`.                                                |
| `acceptedAccuracy`   | Exact accuracy among accepted results, or `null` if none.                      |
| `abstentionRate`     | Fraction returning uncertainty.                                                |
| `correctAbstentions` | Count correctly abstaining on rows with `output: null`.                        |
| `failures`           | Array of `{ input, expected, actual }`; uncertainty appears as `actual: null`. |

Object key order does not affect exact matching; array order does. See [evaluation](../evaluation.md) for separate training, validation, test, and challenge sets.

## TrainingConfig

`TrainingConfig` is the optional task configuration type. See [every field and default](configuration.md).
