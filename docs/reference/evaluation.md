# Evaluation API

```ts
import { evaluate } from "@matchbox-ai/train";
const metrics = await evaluate(parser, examples, (value) => task.validateOutput(value).success);
```

Arguments are a `MatchboxParser<unknown, Input>`, nonempty `readonly DatasetExample<unknown, Input>[]`, and `(value: unknown) => boolean` for output validation. It returns a promise for the metrics below. It does not train, select thresholds, dispose the parser, or enforce an acceptance gate. Caller errors and parser rejections propagate. Pass a nonempty set; empty input currently produces non-finite ratio metrics.

| Field                | Meaning                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `examples`           | Number evaluated.                                                                |
| `exactAccuracy`      | Fraction whose complete output matches.                                          |
| `invalidOutputRate`  | Fraction of evaluated inputs producing an accepted output that fails validation. |
| `accepted`           | Count returning `status: "ok"`.                                                  |
| `acceptedAccuracy`   | Exact accuracy among accepted results, or `null` if none.                        |
| `abstentionRate`     | Fraction returning uncertainty.                                                  |
| `correctAbstentions` | Count correctly abstaining on rows with `output: null`.                          |
| `failures`           | Array of `{ input, expected, actual }`; uncertainty appears as `actual: null`.   |

`Input` is inferred from the parser and examples; failure records retain that input type. Object key order does not affect exact matching; array order does. See [evaluation](../evaluation.md) for separate training, validation, test, and challenge sets.
