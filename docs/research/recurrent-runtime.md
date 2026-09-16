# Recurrent browser integration

The public recurrent pipeline reproduces the [research model](sequence-parts.md) on the entire frozen lexer corpus and runs through the generated browser API. Its test confusion matrix and every epoch's validation score match the research run exactly. These measurements use local workspace builds; they do not change the independent consumer repository's published-package results.

The authored API uses `recurrentTokenClassifier()`, `textParts()`, `textFeatures()` and `spanLabels({ whitespace: "context" })`. The application retains its parser schema, labels and decoder. [The complete authoring contract](../primitives/recurrent-token-classifier.md) covers each primitive and its limitations.

## Training and quality

All 4,174 training documents, 336 validation documents and 1,915 test documents are used. The public encoder and span supervision match the research preparation exactly on all 5,624,939 parts. Eight epochs use seed 42, Adam at 0.003 and a 4,096-part padded batch budget. Validation selects epoch 3; test labels do not select it.

| Measurement                                              |        Result |
| -------------------------------------------------------- | ------------: |
| Test non-whitespace code-point agreement                 |        82.50% |
| Styled macro F1                                          |        76.90% |
| Code points above confidence 0.75                        |        77.08% |
| Agreement within that coverage                           |        90.82% |
| Complete-output exact accuracy with default `.parse()`   |        10.39% |
| Default `.parse()` accepted documents                    |   344 / 1,915 |
| Exact accuracy among those accepted documents            |        57.85% |
| Schema-invalid outputs                                   |             0 |
| Parameters                                               |        36,233 |
| Float32 Burn weights                                     | 145,333 bytes |
| Packaged artifact, including metadata and base64 weights | 194,850 bytes |
| Native optimization and per-epoch validation             |      899.47 s |
| Preparation, training and export parity                  |      911.37 s |

The training timer excludes project loading and final full parser/diagnostic evaluation. Checks overlapped on an Apple M2 with 8 GiB RAM. These timings are observed costs, not isolated comparisons with earlier runs.

Native/WASM parity checks cover 409,442 parts from all validation documents and the first 16 training documents. There are zero label or threshold-decision disagreements; the maximum confidence difference is 0.0000008941 against a 0.0001 tolerance.

The research export explicitly uses `minAccuracy: 0`, so it does not satisfy the default production acceptance requirement. The whole-document numbers matter: this model is useful evidence for a highlighting candidate, not a dependable complete parser. Above-threshold predictions still contain errors, and the reused research corpus does not establish generalization to a fresh corpus.

## Browser behavior

A production Vite build imports the generated TypeScript wrapper. Headless Chromium 153 on the same M2 measures one `.parse(input, { allowPartial: true })` call per complete test document after 20 warmup documents. Timing includes encoding, Burn WASM inference, authored decoding and schema validation.

| Measurement                                              |   Result |
| -------------------------------------------------------- | -------: |
| First parse, including lazy runtime/model initialization | 478.7 ms |
| Warm p50 across 1,915 full test documents                |   0.9 ms |
| Warm p95                                                 |  21.1 ms |
| `ok` results                                             |      344 |
| `partial` results                                        |    1,387 |
| `uncertain` results                                      |      184 |

This corpus has varying document lengths, so sub-millisecond median latency is not a guarantee for long inputs. These are desktop measurements, not physical-phone measurements. The shared WASM asset is 775,719 bytes before compression; it is additional to each model artifact. See the [machine-readable report](recurrent-runtime.json) for its gzip size and complete measurements.

Partial candidates cover 1,445,607 of 1,446,363 scored code points. Their 82.52% agreement has a different denominator from unconditional diagnostic agreement. Confident coverage and agreement reproduce the diagnostic values above. The 184 wholly uncertain documents return no candidate. A post-load probe with all network requests blocked also succeeds.

## Reproduce

Build the framework packages first. Use the independent [matchbox-lexer](https://github.com/alexpatow/matchbox-lexer) checkout and its `full-clean-v1` corpus, keeping that repository's published dependency pins intact. Create a local ignored task under `.matchbox/research/integrated-lexer/` and copy its `parser.ts`, `labels.ts` and `decode.ts` into that directory.

Author these two files in the ignored task:

```ts
// pipeline.ts
import { definePipeline, recurrentTokenClassifier } from "@matchbox-ai/train";
export default definePipeline({
  prediction: recurrentTokenClassifier(),
  // Research export only; this is not a production quality gate.
  acceptance: { minAccuracy: 0, maxBytes: 2_000_000 },
});
```

```ts
// recipe.ts
import { textParts, textFeatures, spanLabels, type RecurrentRecipe } from "@matchbox-ai/train";
import { labels } from "./labels.ts";
export default {
  tokenizer: textParts(),
  features: textFeatures(),
  labels,
  annotate: spanLabels({ whitespace: "context" }),
} satisfies RecurrentRecipe;
```

Set `train`, `validation` and `eval` in its `matchbox.config.ts` to the three frozen JSONL files, and `output` to `"./output/model.matchbox"`. Then run:

```sh
bun run build:packages
bun run matchbox train .matchbox/research/integrated-lexer --verbose
bun apps/benchmarks/scripts/recurrent.ts \
  .matchbox/research/integrated-lexer/output/model.ts \
  "$CORPUS/test.jsonl" \
  .matchbox/research/recurrent-browser.json
```

The browser runner refuses to overwrite its output. Keep models, full failure reports, corpus data and browser builds ignored. Corpus hashes, compact quality metrics and timing evidence are in the linked report.

The subsequent [matched WebGPU evaluation](recurrent-webgpu.md) compares the same checkpoint with the pinned reference on identical validation documents, including runtime downloads, coverage and full-pipeline browser latency.
