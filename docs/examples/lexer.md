# Syntax highlighting

The [Matchbox Lexer example](https://github.com/alexpatow/matchbox-lexer) trains on labeled source code and highlights text locally using published Matchbox packages. It is inspired by [gpu-lexer](https://github.com/vercel-labs/gpu-lexer) by [Shu Ding](https://github.com/shuding). Shiki supplies offline training labels and an explicitly loaded reference; it is never an inference fallback.

Use this pattern when a label depends on context earlier or later in a document. The application owns the label vocabulary, output schema and span decoder. Matchbox learns the predictions.

## Author the task

```text
matchbox/lexer/
  parser.ts
  pipeline.ts
  recipe.ts
  decode.ts
  labels.ts
  data/train.jsonl
  evals/validation.jsonl
  evals/test.jsonl
scripts/
  prepare-data.ts
```

`parser.ts` declares an array of `{ type, start, end }` spans. Each type belongs to an application-defined label vocabulary. Offsets are UTF-16 indices with an exclusive end. Training rows pair source text with these spans, including labels for neutral text.

```ts
// matchbox/lexer/pipeline.ts
import { definePipeline, recurrentTokenClassifier } from "@matchbox-ai/train";

export default definePipeline({
  prediction: recurrentTokenClassifier(),
  acceptance: { minAccuracy: 0.95, maxBytes: 250_000 },
});
```

These acceptance values are example requirements, not the measured accuracy of the linked model. Set them from your application's requirements. `minAccuracy` gates exact complete outputs, not character agreement.

```ts
// matchbox/lexer/recipe.ts
import { textParts, textFeatures, spanLabels, type RecurrentRecipe } from "@matchbox-ai/train";
import { labels } from "./labels";

export default {
  tokenizer: textParts(),
  features: textFeatures(),
  labels,
  annotate: spanLabels({ whitespace: "context" }),
} satisfies RecurrentRecipe;
```

`textParts` preserves source boundaries. `textFeatures` encodes mechanical text features without a keyword dictionary. `spanLabels` supplies supervision from the labeled outputs; whitespace provides context without contributing to loss or confidence acceptance. A part can contain mixed training labels, but inference predicts one label per part.

`decode.ts` receives tagged parts and merges adjacent labels into spans. It must remain browser-safe. It does not call Shiki, parse syntax with rules, or invent missing labels. See [the complete parser and decoder definitions](../primitives/recurrent-token-classifier.md) before authoring a task.

## Train and evaluate

```sh
bunx matchbox-ai train lexer
bunx matchbox-ai eval lexer
```

Training selects a checkpoint using the separate validation split, checks native/WASM prediction parity and packages the generated wrapper. Keep test data independent. Recurrent input limits reject oversized training documents and produce uncertainty at inference; neither path silently truncates.

The linked consumer records full-corpus training time, package versions, dataset hashes and held-out results. Its research export gate deliberately permits low exact accuracy so the model can be measured. Copying that gate does not establish production readiness.

## Render a preview

```ts
import lexer from "./.matchbox/lexer/model";

const result = await lexer.parse(source, { allowPartial: true });

switch (result.status) {
  case "ok":
    // Render result.value. Predictions can still be wrong.
    break;
  case "partial":
    // Render result.value and mark result.uncertainRanges in the source.
    break;
  case "uncertain":
    // Keep the source unstyled. result.value is null.
    break;
}
```

`uncertainRanges` uses the original source offsets, including when the decoder merges spans. The candidate includes uncertain labels. Coverage of returned labels is therefore different from confident coverage. Scores are uncalibrated.

For explicit browser GPU execution, pass both options:

```ts
const result = await lexer.parse(source, { gpu: true, allowPartial: true });
```

GPU is optional and loads a separate runtime. An unavailable GPU rejects the promise. The default `parse(source)` remains strict CPU parsing. See [runtime options](../reference/runtime.md#parse-options) and [React integration](../react.md#recurrent-models-and-partial-results).

## Read the evidence

The consumer's [versioned results](https://github.com/alexpatow/matchbox-lexer/tree/main/benchmarks/results) separate strict acceptance, partial candidates and raw diagnostic predictions. They also measure complete-document CPU/GPU latency and fetched runtime size against pinned gpu-lexer 0.0.2. The models have different training histories, so this is a consumer comparison, not a controlled architecture comparison.
