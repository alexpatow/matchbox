# Character encoding and context

A wider local window improved lexical recognition on the frozen test corpus, but whole-input abstention still prevents this model from being a useful lexer. Case preservation alone did not improve aggregate validation accuracy. Neither setting changes the default pipeline.

These are framework-local experiments with Burn, measured on September 16, 2026. They are separate from the [published-package consumer](https://github.com/alexpatow/matchbox-lexer). The [machine-readable evidence](sequence-context.json) contains dataset hashes, per-class metrics, confusion matrices, document counts, loss histories, training timings, and browser samples. Generated weights remain outside Git.

## Method

Each experiment uses all 4,174 training records and 12,245,739 supervised Unicode code points from `full-clean-v1`. Vocabulary is fitted on training data only. The frozen validation set contains 336 records and 750,030 scored non-whitespace code points. The final test set contains 1,915 records and 1,446,363 scored non-whitespace code points.

The reference model uses published 0.2.2 weights. The two new models change one authored setting each. All use the same embedding-window MLP, eight-dimensional embeddings, 16 hidden units, Adam learning rate 0.005, batch size 128, seed 42, and 55 epochs. Increasing the context window also increases the first linear layer's parameter count. Casing and context were not combined in this experiment.

The context-four configuration was selected using validation, then evaluated once on the frozen test set. Its settings were not adjusted after that evaluation. Accuracy is character-weighted; styled macro F1 averages the eight non-plain labels equally. Diagnostic predictions bypass application acceptance, so these scores do not measure successful parser output.

## Validation

| Configuration            | Parameters | Artifact bytes | Token accuracy | Accepted inputs |
| ------------------------ | ---------: | -------------: | -------------: | --------------: |
| Lowercase, radius 1      |     12,625 |         77,516 |         59.86% |         0 / 336 |
| Preserved case, radius 1 |     13,081 |         80,189 |         59.43% |         0 / 336 |
| Lowercase, radius 4      |     13,393 |         81,595 |         61.58% |         0 / 336 |

Paired document bootstrap intervals use 2,000 resamples with seed 4231. The accuracy difference for case preservation is -0.43 percentage points, with a 95% interval of -1.28 to +0.24 points. The difference for radius four is +1.72 points, with an interval of -1.81 to +5.58 points. These intervals describe document sampling uncertainty, not variation across training seeds. The validation ranking alone is weak evidence of general improvement.

## Frozen test

| Metric                           | Reference, radius 1 | Selected, radius 4 |
| -------------------------------- | ------------------: | -----------------: |
| Diagnostic token accuracy        |              44.89% |             58.17% |
| Diagnostic styled macro F1       |              31.29% |             46.51% |
| Accepted inputs                  |         115 / 1,915 |         74 / 1,915 |
| Whole-input abstention           |              93.99% |             96.14% |
| Exact structured output accuracy |               5.17% |              3.13% |

Better token recognition did not improve the application contract. The selected model abstains on 551 inputs at the unchanged 512 UTF-16-unit limit, abstains on 1,284 for low recognition confidence, and abstains on six for unknown vocabulary. Its 74 accepted inputs include only 60 exact outputs. Confidence remains uncalibrated, and every token must meet the threshold before the parser returns a result.

## Training and browser cost

Both new models trained on an 8 GB Apple M2 using native Burn CPU. Native fit includes the binding call and weight serialization; process wall time also includes preparation and validation diagnostics.

| Configuration            | Native fit | Process wall time | Peak resident memory |
| ------------------------ | ---------: | ----------------: | -------------------: |
| Preserved case, radius 1 |   501.03 s |          505.76 s |  1,169,162,240 bytes |
| Lowercase, radius 4      |   585.92 s |          594.24 s |  1,437,974,528 bytes |

The historical reference ran through the full published CLI, so its total training time is not an equivalent isolated fit measurement. These runs measure local development costs, not an isolated hardware benchmark.

Browser measurements use fresh headless Chromium contexts, five warmups, and 30 calls per input length. Inputs are fixed 128- and 512-unit prefixes selected from validation. Initialization excludes JavaScript import and artifact fetch. Timing covers diagnostic token inference, including tokenization, but excludes decoding and parser acceptance.

| Configuration            | Initialization | 128 units p50 / p95 | 512 units p50 / p95 |
| ------------------------ | -------------: | ------------------: | ------------------: |
| Lowercase, radius 1      |        36.5 ms |        0.2 / 0.9 ms |        0.5 / 0.7 ms |
| Preserved case, radius 1 |        29.3 ms |        0.2 / 0.5 ms |        0.6 / 0.7 ms |
| Lowercase, radius 4      |        36.4 ms |        0.3 / 3.3 ms |        0.7 / 2.5 ms |

Small samples, timer resolution, garbage collection, and initialization variability limit these timing comparisons. Artifact sizes exclude the shared WASM runtime and authored decoder.

Native and WASM agree on labels and threshold decisions for all 945,166 export-probe tokens in both new models. Maximum confidence differences remain below the existing 0.0001 tolerance. The selected model also passes parity on all 1,841,059 test tokens, including whitespace.

## Implications

`casing: "preserve"` makes an information-preserving encoding available explicitly. It should not be enabled automatically on the assumption that it improves a task. `tokenClassifier({ contextRadius: 4 })` provides more local evidence at modest model-size cost, but a nine-character window cannot recover long-range lexical state.

The pinned [gpu-lexer architecture](https://github.com/vercel-labs/gpu-lexer/blob/1e514fd681e31d6b19296f985fb01d8fdc0ae74f/architecture.md) uses bidirectional learned state and whole-source context. This experiment does not reproduce that architecture or its training history. A materially different sequence model should have its own learning primitive rather than accumulate architecture switches in the fixed-window classifier.

See the [reproduction workflow](../contributing.md#sequence-context-experiments) and the [public context contract](../reference/pipeline.md#token-context).
