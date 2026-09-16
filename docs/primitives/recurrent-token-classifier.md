# Recurrent token classification

Use `recurrentTokenClassifier` when a label depends on context beyond a fixed token window, such as the start of a comment or quoted region earlier in a document. It is a separate strategy alongside `fieldClassifier` and `tokenClassifier`. Existing pipelines and artifacts keep their behavior.

## Define the task

The application owns the labels and output schema. This example returns source spans with UTF-16 offsets and an exclusive end.

```ts
// matchbox/lexer/parser.ts
import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";

export default defineParser({
  input: z.string(),
  output: z.array(
    z.strictObject({
      type: z.enum(["plain", "comment", "string"]),
      start: z.number().int().nonnegative(),
      end: z.number().int().positive(),
    }),
  ),
});
```

```ts
// matchbox/lexer/pipeline.ts
import { definePipeline, recurrentTokenClassifier } from "@matchbox-ai/train";

export default definePipeline({
  prediction: recurrentTokenClassifier(),
  acceptance: { minAccuracy: 0.95, maxBytes: 250_000 },
});
```

`recipe.ts` and `decode.ts` follow the same discovery conventions as other token tasks. `recipe/recipe.ts` and `decode/decode.ts` also work.

```ts
// matchbox/lexer/recipe.ts
import { textParts, textFeatures, spanLabels, type RecurrentRecipe } from "@matchbox-ai/train";

export default {
  tokenizer: textParts(),
  features: textFeatures(),
  labels: ["plain", "comment", "string"],
  annotate: spanLabels({ whitespace: "context" }),
} satisfies RecurrentRecipe;
```

`textParts()` groups words, horizontal whitespace, newlines and individual symbols without discarding source text. CRLF stays together. Non-ASCII UTF-16 units belong to word runs, preserving surrogate pairs. This is a mechanical segmenter, not a language parser.

`textFeatures()` encodes part kind, length, case/character shape, spelling hashes, line starts and neighboring symbols. Its categorical space is fixed and versioned. Unseen words can be encoded; hash collisions and lost spelling information can still cause wrong predictions. The encoder contains no keyword, currency or other semantic dictionaries.

`spanLabels({ whitespace })` declares supervision from each example's output array of `{ type, start, end }` spans. Spans must be ordered, non-overlapping, within the input and aligned to Unicode code-point boundaries. Labels must be declared in the recipe. Every supervised code point needs a label, including neutral text. Omitted text is not automatically labeled `plain`.

With `whitespace: "context"`, whitespace participates in context but not the loss, diagnostic agreement or acceptance threshold. With `"supervise"`, it also requires labels and contributes to those measurements. Every label needs training supervision. A part spanning several labels contributes all code-point label counts to training; the model still predicts one label per part. Boundaries inside a part cannot be recovered by this classifier alone.

This first recurrent recipe supports the explicit span-supervision descriptor above. It does not accept the fixed-window recipe's annotation callback, dropout or rejection fields. The output schema must describe the supplied span arrays; Matchbox does not infer span supervision from an arbitrary schema.

## Decode predictions

```ts
// matchbox/lexer/decode.ts
import type { SequenceDecoder } from "@matchbox-ai/core/runtime";

export default ((tokens) =>
  tokens
    .filter((token) => token.text.trim().length > 0)
    .map(({ label, start, end }) => ({ type: label, start, end }))) satisfies SequenceDecoder;
```

The decoder receives original text, offsets, the predicted label and confidence for every part, including whitespace. It can merge adjacent spans or apply application-owned structural checks. In this example, whitespace-only parts are omitted because their labels are not supervised. Every returned candidate passes the task's Zod schema before leaving the runtime.

## Train and evaluate

Provide `data/train.jsonl`, `evals/validation.jsonl` and `evals/test.jsonl` with the usual [dataset contract](../dataset-format.md), then run:

```sh
bunx matchbox-ai train
bunx matchbox-ai eval
```

Training uses native Burn and whole-document batches. Validation code-point label agreement selects the checkpoint. The complete parser's validation exact accuracy and packaged artifact size gate export. Test labels never select checkpoints. A high character agreement score does not imply high whole-document exact accuracy.

Reports separate parser acceptance from diagnostic code-point agreement, confidence coverage and agreement within that coverage. They include dataset and supervision hashes, training duration, per-epoch losses and validation scores, selected epoch, model size, and native/WASM prediction parity. The default confidence threshold remains 0.75 and is uncalibrated.

| Option             |                    Default | Contract                                                              |
| ------------------ | -------------------------: | --------------------------------------------------------------------- |
| `epochs`           |                          8 | Integer from 1 to 100.                                                |
| `learningRate`     |                      0.003 | Greater than zero, at most 0.1.                                       |
| `batchParts`       |                       4096 | Padded batch budget, from 128 to 16384. A longer document runs alone. |
| `maxInputLength`   |                     262144 | UTF-16 input limit, from 1 to 1000000.                                |
| `maxParts`         |                      65536 | Per-document part limit, from 1 to 65536.                             |
| `recipe`, `decode` | `"./recipe"`, `"./decode"` | Task-relative module paths.                                           |

The recurrent strategy defaults to a 256,000-byte artifact budget; `acceptance.maxBytes` overrides it. Other strategies retain their 64,000-byte default.

Training rejects oversized examples; inference abstains on oversized inputs. Neither silently truncates. The preparer supports at most 20 million parts per split and materializes typed arrays in memory. Input limits are upper bounds, not guarantees that a device has enough memory. Longer documents cost more time and memory, and their predictions can depend on either end of the document. This is not a streaming model.

## Consume the model

The generated wrapper retains the familiar API:

```ts
import lexer from "./.matchbox/lexer/model";

const result = await lexer.parse(source);
```

The default returns `ok` only when every supervised part clears the threshold and decoding passes schema validation. Otherwise it returns `uncertain` with a null value.

For highlighting or another interface that can visibly distinguish uncertain regions, opt into partial results:

```ts
const result = await lexer.parse(source, { allowPartial: true });

if (result.status === "partial") {
  renderCandidate(result.value, result.uncertainRanges);
}
```

`partial` contains a schema-validated candidate, including predictions in uncertain regions. Its `uncertainRanges` identify low-confidence source parts with UTF-16 `start`, exclusive `end` and `confidence`. Adjacent uncertain ranges are merged. Overall confidence remains the minimum supervised-part score. It is not inflated by ignoring difficult positions.

All-low-confidence inputs, invalid decoded output and unsupported input sizes still return `uncertain`. A decoder may combine or transform parts, so source ranges do not identify which arbitrary output fields are trustworthy. Partial output is suitable for a preview, not automatic execution of a query or command. Above-threshold predictions can also be wrong.

The React hook preserves the overload:

```ts
const loadLexer = () => import("./.matchbox/lexer/model");
// Inside a component:
const lexer = useMatchbox(loadLexer);
const result = await lexer.parse(source, { allowPartial: true });
```

This capability is additive. Existing field and fixed-window token models retain their original result types. See [measured lexer research](../research/sequence-parts.md) for quality evidence and limitations.
