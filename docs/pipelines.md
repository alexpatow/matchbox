# Choose a pipeline

The parser defines valid input and output. `pipeline.ts` defines how the model learns.

| Strategy                     | Use when                                                | Limitation                                                                  |
| ---------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| `featureClassifier()`        | Inputs have an explicit numeric representation.         | Requires an authored encoder; predicts finite field values, not regression. |
| `fieldClassifier()`          | Output fields have small, finite sets of values.        | Can only predict values observed in training; ignores word order.           |
| `tokenClassifier()`          | Nearby tokens identify spans your decoder can assemble. | Uses a fixed context window and accepts or rejects the whole result.        |
| `recurrentTokenClassifier()` | Labels depend on context across a document.             | Predicts one label per text part; needs span-output supervision.            |

## Numeric features

For object or array inputs, author an encoder shared by training and inference:

```ts
import { definePipeline, featureClassifier } from "@matchbox-ai/train";

export default definePipeline({
  prediction: featureClassifier({ encode: "./encode", threshold: 0.8 }),
});
```

The encoder returns a fixed-length numeric vector. The model predicts finite field values observed in training, not arbitrary coordinates or unseen numbers. See the [encoder contract](primitives/feature-classifier.md) and [sketch example](examples/sketch.md).

## Finite values

```ts
import { definePipeline, fieldClassifier } from "@matchbox-ai/train";

export default definePipeline({
  prediction: fieldClassifier(),
  acceptance: { minAccuracy: 0.95 },
});
```

This bag-of-words classifier learns each field's values from training data. A numeric field is still a finite class; it cannot produce an unseen number. Unknown vocabulary causes uncertainty, while familiar words in a new order can produce a confident wrong answer.

## Spans and decoding

```ts
import { definePipeline, tokenClassifier } from "@matchbox-ai/train";

export default definePipeline({
  prediction: tokenClassifier(),
  acceptance: { minAccuracy: 0.9 },
});
```

Author a [recipe and decoder](reference/supervision.md). The recipe supplies token labels for training. The decoder assembles predicted spans into the output, including any explicit number conversion or arithmetic. Matchbox checks that training annotations decode to the expected outputs.

For document-wide context, use the [recurrent classifier](primitives/recurrent-token-classifier.md). It adds text-part features, span supervision and optional partial results. The [lexer example](examples/lexer.md) shows it in use.

## Choose by evaluation

A schema does not choose an encoding or a normalizer. Select a strategy using validation examples, then measure accuracy, coverage, download size and latency on independent data. See the [pipeline API](reference/pipeline.md) for options.

A browser LLM is another option for open-ended generation or tasks that change through prompts. Matchbox requires task-specific training. Model sizes shown in the examples exclude the shared runtime and decoder; these examples have not been benchmarked against a browser LLM.
