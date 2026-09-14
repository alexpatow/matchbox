# Pipeline API

```ts
import { definePipeline, wordTokens, fieldClassifier, tokenClassifier } from "@matchbox-ai/train";
```

## definePipeline

`definePipeline(pipeline: Pipeline): Pipeline` validates a declaration and returns it. Invalid declarations throw a Zod validation error. It does not train or load TensorFlow.

| Property                 | Type                                   | Required               | Behavior                                           |
| ------------------------ | -------------------------------------- | ---------------------- | -------------------------------------------------- |
| `input`                  | `{ kind: "words" }`                    | For field classifiers. | Chooses word features. Omit for token classifiers. |
| `prediction`             | Field or token classifier declaration. | Yes.                   | Chooses one of the two implemented strategies.     |
| `acceptance.minAccuracy` | Number from 0 to 1.                    | No.                    | Minimum validation exact accuracy for export.      |
| `acceptance.maxBytes`    | Positive number.                       | No.                    | Maximum serialized model size in bytes.            |

Unknown properties are rejected. See [configuration](configuration.md) for resolved defaults and overrides.

## wordTokens

`wordTokens(): { kind: "words" }` declares the field classifier's literal word features. Features are fitted from training data only. Word order is discarded; unfamiliar vocabulary can cause uncertainty.

## fieldClassifier

`fieldClassifier(): { kind: "field-classifier" }` declares independent categorical predictions over values observed in training outputs.

```ts
export default definePipeline({
  input: wordTokens(),
  prediction: fieldClassifier(),
  acceptance: { minAccuracy: 0.95 },
});
```

Use it for small, finite output domains. A numeric field is still a finite class, so this strategy cannot produce an unseen number. It is not a general JSON generator.

## tokenClassifier

`tokenClassifier({ recipe: string, decode: string })` returns a token classifier declaration. Both paths are required and resolve relative to the task directory.

```ts
export default definePipeline({
  prediction: tokenClassifier({ recipe: "./lib/recipe.ts", decode: "./lib/decode.ts" }),
  acceptance: { minAccuracy: 0.9 },
});
```

The recipe owns tokenization and training supervision. The decoder ships to the browser. See [their contracts](supervision.md). Schemas do not select encodings, dictionaries, or normalization rules.
