# Example evaluation

The Burn models improved after expanding the training examples. The decoders and model architecture stayed unchanged. See [the language experiment](experiments/language.md) for before/after results, rejected candidates, overlap accounting and the evaluation limitations.

## Current audit

The frozen synthetic audit is now regression evidence: its earlier failures were known before this work. It is not a user-traffic sample or an independent measure of production accuracy. No audit rows were added to training or used for candidate selection.

Exact match includes correct abstentions. Accepted accuracy measures the outputs returned to the application. These results contain no schema-invalid outputs, but that alone does not establish semantic correctness.

| Example | Exact match | Accepted accuracy | False accepts on negatives |
| ------- | ----------- | ----------------- | -------------------------- |
| is-even | 8/8         | 5/5               | 0/3                        |
| Money   | 18/20       | 10/10             | 0/8                        |
| Time    | 19/20       | 11/11             | 0/8                        |
| Filters | 14/16       | 8/8               | 0/6                        |

Money still falsely accepts `budget above 58 euros` in the separate language-development suite. Zero false accepts on this audit does not mean all unsupported inputs are handled correctly. Confidence remains an uncalibrated recognition score.

## Remaining failures

The audit still produces abstentions for:

- `payment received: 29 euros`.
- `our subscription costs 21 euros monthly`.
- `in two days and four hours`.
- `hide the churned customers`.
- `only companies based in Germany`.

The separate language test also exposes `show me all companies based in Norway`. These inputs are legitimate requests; the model does not yet cover them reliably.

## What the examples establish

Filters share ARR and status restrictions across country alternatives through the application decoder. Money learns to distinguish invoice/year numbers from payment amounts. Time now has training examples for minutes-plus-seconds compositions. Parity remains a training sanity check; use deterministic arithmetic in an application.

Word-mode numeric inputs share a token, so a novel amount can be feature-equivalent to training. The language report excludes those overlaps from its novelty comparison, including matches to rejection training. Even a novel full sentence can consist of familiar three-token windows. Country normalization still uses an application-owned reference. These examples do not establish broad language understanding or learned geographical knowledge.

## Artifact cost

These figures include metadata, vocabulary and base64-encoded float32 Burn records. They exclude the shared runtime and application decoders. No int8 quantization is applied in this experiment.

| Example | Parameters | Artifact bytes |
| ------- | ---------: | -------------: |
| is-even |        530 |          3,898 |
| Money   |      1,458 |          9,875 |
| Time    |      1,255 |          8,993 |
| Filters |      7,728 |         58,352 |

The shared WASM binary is 689,531 bytes, or 183,093 bytes with gzip, excluding JavaScript glue and the app itself. The website reads artifact sizes from each build's training reports.

Browser tests verify record and sequence inference with networking blocked, and record cold initialization and warm latency separately. Desktop mobile emulation is not physical-phone performance. Browser timer granularity limits sub-millisecond comparisons.

## Reproduce

```sh
bun run train
bun scripts/evaluate-language.ts test
bun run eval:examples
bun run test:browser
```

Reports include artifact hashes, case hashes, exact-match failures and feature-overlap counts. [The recorded language results](experiments/language-results.json) retain the before/after comparison. Future quality claims need independently authored application examples and larger samples.
