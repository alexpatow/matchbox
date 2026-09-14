# Token supervision and decoding

Use a token pipeline when the model should identify parts of the input and application code should assemble the result.

## Why separate modules?

The current token pipeline takes paths to default-exported recipe and decoder modules. The training process loads the recipe; the generated browser wrapper imports the decoder directly. This keeps training annotations and training dependencies out of the application bundle.

The recipe file is an authoring convention of the current API, not a requirement of machine learning. The decoder is an application-owned runtime dependency. Keep its imports browser-safe, including any number-conversion helpers. The [money example](../examples/money.md) exposes these files separately so you can inspect both learned recognition and authored arithmetic.

## SequenceRecipe

```ts
import type { SequenceRecipe } from "@matchbox-ai/train";
```

| Property    | Type                                               | Meaning                                             |
| ----------- | -------------------------------------------------- | --------------------------------------------------- |
| `tokenizer` | `"words"` or `"characters"`                        | Chooses token boundaries.                           |
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

`tokenize(input: string, mode: "words" | "characters"): Token[]` is shared with annotation generators. Word mode separates numbers, letter runs, and punctuation; numeric token keys become `<number>`. Character mode iterates Unicode code points. Original text and offsets are preserved.

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
