# Pipeline API

```ts
import {
  definePipeline,
  fieldClassifier,
  featureClassifier,
  tokenClassifier,
  recurrentTokenClassifier,
} from "@matchbox-ai/train";
```

## definePipeline

`definePipeline` validates a declaration, fills defaults and returns a `Pipeline`. Its input permits omitted defaulted options. Invalid declarations throw a Zod validation error. It does not train or load Burn.

| Property                 | Type                                                       | Required | Behavior                                      |
| ------------------------ | ---------------------------------------------------------- | -------- | --------------------------------------------- |
| `prediction`             | Field, feature, token or recurrent classifier declaration. | Yes.     | Chooses an explicit learning strategy.        |
| `acceptance.minAccuracy` | Number from 0 to 1.                                        | No.      | Minimum validation exact accuracy for export. |
| `acceptance.maxBytes`    | Positive number.                                           | No.      | Maximum serialized model size in bytes.       |

Unknown properties are rejected. See [configuration](configuration.md) for resolved defaults and overrides.

## fieldClassifier

`fieldClassifier(): { kind: "field-classifier" }` declares independent categorical predictions over values observed in training outputs. It uses literal word features fitted from training data only. Word order is discarded; unfamiliar vocabulary can cause uncertainty.

```ts
export default definePipeline({
  prediction: fieldClassifier(),
  acceptance: { minAccuracy: 0.95 },
});
```

Use it for small, finite output domains. A numeric field is still a finite class, so this strategy cannot produce an unseen number. It is not a general JSON generator.

## tokenClassifier

`tokenClassifier(options?)` returns a token classifier declaration. It discovers `recipe.ts` or `recipe/recipe.ts`, and `decode.ts` or `decode/decode.ts`. Both modules remain authored and required for training. Optional `recipe` and `decode` string paths override these locations, relative to the task directory even when the pipeline lives in `pipeline/pipeline.ts`. Explicit filenames are used exactly; extensionless paths follow the named file-or-folder convention.

```ts
export default definePipeline({
  prediction: tokenClassifier(),
  acceptance: { minAccuracy: 0.9 },
});
```

The recipe owns tokenization and training supervision. The decoder ships to the browser. See [their contracts](supervision.md). Schemas do not select encodings, dictionaries, or normalization rules.

## Token context

`tokenClassifier({ contextRadius: 4 })` gives each prediction four tokens on either side of the current token, nine tokens total. Radius is an integer from 1 through 16 and defaults to 1. Tokens are Unicode code points in character mode and tokenizer units in word mode. Positions outside the current input are padded; context never crosses an example boundary.

```ts
export default definePipeline({
  prediction: tokenClassifier({ contextRadius: 4 }),
});
```

This remains a fixed-window classifier. Burn embeds the window and learns a small feedforward network; there is no recurrent state, attention, or awareness beyond that window. Wider context increases training memory, model size, and compute, and may not improve held-out accuracy. Choose it using independent validation examples, then report results on an untouched test set.

Casing belongs in the [recipe](supervision.md), independently of context size:

```ts
import type { SequenceRecipe } from "@matchbox-ai/train";

export default {
  tokenizer: "characters",
  casing: "preserve",
  readout: "all",
  labels,
  annotate,
} satisfies SequenceRecipe;
```

Retrain after either change. New sequence artifacts use format version 4 and require a compatible runtime. The runtime still reads version 3 artifacts with their original lowercase, radius-one behavior. These choices do not change the 512 UTF-16-unit parser limit, whole-result abstention, or confidence calibration.

## recurrentTokenClassifier

`recurrentTokenClassifier(options?)` adds whole-sequence learned context using versioned text-part features. Its `RecurrentRecipe` and span supervision are separate from `SequenceRecipe`; existing classifier declarations are unchanged. See the [complete authoring, training and runtime contract](../primitives/recurrent-token-classifier.md), including options, input limits and opt-in partial results.

## featureClassifier

`featureClassifier({ encode: "./encode", threshold: 0.75 })` learns finite field values from application-authored numeric features. It supports structured input schemas and shares the encoder between training and inference. See the [encoder, output and runtime contracts](../primitives/feature-classifier.md).
