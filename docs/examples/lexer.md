# Syntax highlighting

The Matchbox Lexer example trains on labeled source code and highlights text locally using published Matchbox packages. It is inspired by [gpu-lexer](https://github.com/vercel-labs/gpu-lexer) by [Shu Ding](https://github.com/shuding). Shiki supplies offline training labels and an explicitly loaded reference; it is never an inference fallback.

On the documentation website, try the live editor at the end of this page. It uses a frozen, checksum-verified model; source text stays on your device. The same demo is available on the [examples page](/examples#lexer-title).

## Author the task

Use a [recurrent token classifier](../primitives/recurrent-token-classifier.md). That guide includes the parser, pipeline, recipe and decoder definitions. The output is an array of `{ type, start, end }` spans with UTF-16 offsets and an exclusive end.

The recipe uses `textParts()`, `textFeatures()` and `spanLabels({ whitespace: "context" })`. It learns labels from annotated source text. Whitespace remains context without contributing to loss or acceptance. The browser decoder merges predicted parts into spans.

Keep data preparation in project-level `scripts/`, alongside `matchbox/lexer/`. The [example repository](https://github.com/alexpatow/matchbox-lexer) contains the full pipeline and dataset preparation.

## Train and evaluate

```sh
bunx matchbox-ai train lexer
bunx matchbox-ai eval lexer
```

Training selects a checkpoint using the separate validation split, checks native/WASM prediction parity and packages the generated wrapper. Keep test data independent. Recurrent input limits reject oversized training documents and produce uncertainty at inference; neither path silently truncates.

The evaluated model release records full-corpus training time, package versions, dataset hashes and held-out results. Its research export gate deliberately permits low exact accuracy so the model can be measured. Copying that gate does not establish production readiness.

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

Add `gpu: true` to request browser WebGPU. The default is CPU; an unavailable GPU rejects the promise. See [runtime options](../reference/runtime.md#parse-options).

## Read the evidence

The [evaluated demo release](https://github.com/alexpatow/matchbox/releases/tag/lexer-demo-0.4.0) distinguishes strict acceptance from partial candidate scores. The release records corpus identity, training time and quality. Full-document comparisons against gpu-lexer 0.0.2 remain separate from the live editor's single-call timing. The models have different training histories, so this is a consumer comparison, not a controlled architecture comparison.
