# Token supervision and decoding

Use a token pipeline when the model should identify parts of the input and application code should assemble the result.

## Why separate modules?

The token pipeline discovers default-exported recipe and decoder modules by convention. Use recipe.ts or recipe/recipe.ts, and decode.ts or decode/decode.ts. The training process loads the recipe; the generated browser wrapper imports the decoder directly. This keeps training annotations and training dependencies out of the application bundle.

The recipe file is an authoring convention of the current API, not a requirement of machine learning. The decoder is an application-owned runtime dependency. Keep its imports browser-safe, including any number-conversion helpers. The [money example](../examples/money.md) exposes these files separately so you can inspect both learned recognition and authored arithmetic.

## SequenceRecipe

```ts
import type { SequenceRecipe } from "@matchbox-ai/train";
```

| Property    | Type                                               | Meaning                                             |
| ----------- | -------------------------------------------------- | --------------------------------------------------- |
| `tokenizer` | `"words"` or `"characters"`                        | Chooses token boundaries.                           |
| `casing`    | `"lowercase"` or `"preserve"`                      | Controls token keys; defaults to `"lowercase"`.     |
| `readout`   | `"all"` or `"last"`                                | Predicts at every position or the final position.   |
| `labels`    | `readonly string[]`                                | The label vocabulary.                               |
| `annotate`  | `(example, tokens) => readonly (string or null)[]` | Returns one label or unsupervised `null` per token. |

`example` is `DatasetExample<unknown>`; `tokens` is `readonly Token[]`. The recipe is a default export. Annotation length must equal token count, and labels must belong to the vocabulary. It runs on training examples only. For every training row, Matchbox checks that the supplied labels decode to its expected output.

```ts
const recipe: SequenceRecipe = {
  tokenizer: "words",
  readout: "all",
  labels: ["O", "AMOUNT", "MINUTE"],
  annotate(example) {
    const labels = annotations[example.input];
    if (!labels) throw new Error(`Missing annotation: ${example.input}`);
    return labels;
  },
};
export default recipe;
```

Here `annotations` is an application-owned map aligned to the tokens in each input. `O` is an ordinary label used by examples for neutral tokens, not a framework normalizer.

## tokenize

```ts
import { tokenize } from "@matchbox-ai/train";
const tokens = tokenize("for 90 minutes", "words");
```

`tokenize(input: string, mode: "words" | "characters", casing?: "lowercase" | "preserve"): Token[]` is shared with annotation generators. Word mode separates numbers, letter runs, and punctuation; numeric token keys become `<number>`. Character mode iterates Unicode code points. Original text and offsets are preserved. Keys are lowercased by default. Set `casing: "preserve"` in a recipe when distinctions such as `User` versus `user` carry meaning. Pass the same third argument to `tokenize` in an annotation generator:

```ts
const tokens = tokenize("User user", "characters", "preserve");
```

The vocabulary is still learned only from training data. Case preservation creates distinct vocabulary entries and can increase unknown-token abstention. It does not add a language dictionary or Unicode normalization. In word mode, numeric keys remain `<number>` regardless of casing. Retrain after changing the encoding; the artifact stores the choice for inference.

```ts
interface Token {
  text: string;
  key: string;
  start: number;
  end: number;
}
interface TaggedToken extends Token {
  label: string;
  confidence: number;
}
```

Offsets are UTF-16 indices, with an exclusive end, suitable for `input.slice(start, end)`. Token types are exported from `@matchbox-ai/core/runtime`.

## OutputDecoder / SequenceDecoder

```ts
import type { OutputDecoder } from "@matchbox-ai/train";
// The equivalent runtime type is SequenceDecoder from @matchbox-ai/core/runtime.
```

The signature is `(tokens: readonly TaggedToken[], input: string) => unknown`. Return a candidate JSON value, or `null` when the recognition cannot be assembled. Matchbox validates the candidate with the task schema before returning it to the app.

Keep decoding synchronous and browser-safe. It owns numeric conversion, unit arithmetic, and structural consistency checks. Model recognition remains learned. Avoid consulting a hidden clock, network, or mutable application state; pass relative structures back to the application when context is needed.

## Rejection supervision and unknown tokens

`rejections?: readonly DatasetExample<null>[]` supplies training inputs for which the application cannot produce an answer. These are training rows, separate from evaluation challenges. `annotate` must label every supervised position, and the decoder must return `null` for the supplied labels. The money and time recipes use an application-owned `REJECT` label. Matchbox does not invent rejection rules or labels.

`tokenDropout?: number` accepts a probability from zero through 0.5 and defaults to zero. With a positive value, training adds one copy of each supervised window with token IDs independently replaced by the unknown ID at that probability. Padding is preserved. Masking and minibatch order use fixed seeds, and vocabulary construction only reads training data.

This explicitly trains an unknown embedding. Its exported model attempts recognition on unfamiliar tokens instead of automatically abstaining. The normal recognition threshold, decoder, and schema still apply. With zero dropout, unfamiliar vocabulary causes uncertainty with score zero, as before.

Masking loses information and can introduce contradictory supervision. It can reduce accuracy or cause confident wrong answers. Evaluate familiar regressions, unfamiliar contexts, and negative inputs separately before enabling it. A model that tolerates an unknown name may also overlook an unknown negation. Scores remain uncalibrated token recognition scores, not probabilities that the final answer is correct.

The generated report records rejection counts and hashes the actual token supervision as well as source datasets. These controls make training inspectable; they do not guarantee semantic correctness.

## RecurrentRecipe

Recurrent pipelines use `RecurrentRecipe`, `textParts()`, `textFeatures()` and `spanLabels({ whitespace: "context" | "supervise" })`. These are explicit descriptors exported from `@matchbox-ai/train`. They retain mixed-label part supervision and UTF-16 source ranges. See [recurrent token classification](../primitives/recurrent-token-classifier.md) for the full contract and a decoder example. `SequenceRecipe` remains unchanged.
