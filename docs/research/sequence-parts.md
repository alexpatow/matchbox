# Part features and recurrent context

The recurrent part model reaches **82.50% diagnostic label agreement and 76.90% styled macro F1** on the frozen test corpus. The same-feature local control reaches 70.95% and 70.65%. This supports a separate recurrent classifier primitive, alongside explicit part and feature encoding. It does not establish a shipped browser parser.

This experiment separates input representation from learned sequence context. It uses native Burn research models and the frozen lexer corpus. It does not change the published parser, acceptance policy, CLI, or browser runtime.

## Method

The source corpus is `full-clean-v1`: 4,174 training documents, 336 validation documents and 1,915 test documents. Every document is used in full, including the longest sequences. No chunks, token sampling, vocabulary fitting on held-out data, or source-specific syntax rules are introduced.

The encoder comes from the pinned [gpu-lexer source](https://github.com/vercel-labs/gpu-lexer/tree/1e514fd681e31d6b19296f985fb01d8fdc0ae74f). It splits words, horizontal whitespace, newlines and symbols, then emits categorical part kind, length, edge characters, hashed spelling, shape and boundary features. The adapter explicitly excludes the upstream `pairCode` feature categories. Its remaining neighboring-symbol features use a generic hash. The upstream source is read from a separate checkout and is not bundled with Matchbox.

Labels remain the same nine Shiki-derived display classes. A part can contain characters with different teacher labels. The target preserves their complete class-count distribution rather than choosing a majority label. Loss and evaluation count Unicode code points excluding whitespace. Whitespace remains visible to the model but contributes no loss. This differs from the earlier character model's training supervision, so the character-to-part comparison is not an isolated architecture ablation.

Both candidates sum 32-dimensional sparse feature embeddings and use a five-part local neighborhood, a 32-channel projection, a 64-unit classifier and nine output classes. The recurrent candidate adds learned affine state updates in both directions, with a learned projection back into the local representation. Burn evaluates an associative prefix scan; document boundaries reset state, batching and padding do not. The local candidate uses identical features and supervision without recurrent state. Neither includes gpu-lexer's hierarchy, auxiliary lexical-state targets, quantization-aware training, or pretrained weights.

Both models use seed 42, Adam at 0.003 and eight full epochs. Documents are grouped by length into batches targeting 4,096 padded parts, with a longer document processed alone. Batch order is shuffled deterministically each epoch. Each model selects its checkpoint using validation label agreement, then evaluates the frozen test set. Test scores do not select hyperparameters or checkpoints. This benchmark has been reported in earlier framework iterations; a fresh repository-disjoint holdout is still needed for a final generalization claim.

## Results

The [machine-readable evidence](sequence-parts.json) records both complete training runs, selected checkpoints, per-document counts, confusion matrices, confidence bins, data identities and timings. All models use the same 1,915-document test corpus with 1,446,363 scored code points.

| Model                                        | Validation agreement | Test agreement | Test styled macro F1 |
| -------------------------------------------- | -------------------: | -------------: | -------------------: |
| Published 0.3.0 character model, radius four |               61.58% |         58.17% |               46.51% |
| Local part model                             |               70.48% |         70.95% |               70.65% |
| Recurrent part model                         |               77.57% |         82.50% |               76.90% |
| gpu-lexer 0.0.2 reference                    |    Not measured here |         80.64% |               71.08% |

The [pinned gpu-lexer browser measurement](https://github.com/alexpatow/matchbox-lexer/blob/d614278/benchmarks/results/05-context-four-headed-retry-browser.json) uses a different architecture and training history. Its numbers are not the latest upstream checkpoint's published scores. The Matchbox research numbers are native diagnostic predictions, with no acceptance gate; they do not demonstrate equivalent browser behavior, latency or output coverage.

Adding recurrence to the same part features improves test agreement by **11.55 percentage points**. A paired document bootstrap with 2,000 resamples and seed 4231 gives a 95% interval of **+9.92 to +13.16 points**. The validation difference is +7.09 points, with an interval of +4.00 to +11.11 points. These intervals do not measure training-seed variation or correct for checkpoint selection on validation.

The local model selects epoch seven; the recurrent model selects epoch three. Later training loss falls without consistently improving validation. The final epoch is not automatically the selected model.

| Test label F1 | Local parts | Recurrent parts |
| ------------- | ----------: | --------------: |
| plain         |      70.42% |          79.49% |
| comment       |      70.67% |          93.51% |
| string        |      67.01% |          84.58% |
| number        |      79.56% |          86.12% |
| keyword       |      78.23% |          79.41% |
| type          |      61.28% |          60.70% |
| function      |      73.05% |          72.51% |
| constant      |      57.78% |          58.38% |
| operator      |      77.67% |          80.02% |

## Confidence and coverage

At the existing numerical threshold of 0.75, applied diagnostically to individual parts:

| Measurement                                      | Local parts | Recurrent parts |
| ------------------------------------------------ | ----------: | --------------: |
| Scored characters above threshold                |      55.76% |          77.08% |
| Agreement among those characters                 |      84.79% |          90.82% |
| Documents with every scored part above threshold | 308 / 1,915 |     344 / 1,915 |

No input-length limit is applied in this assessment. These are uncalibrated part scores, not results from `parser.parse`. About 9.2% of the recurrent model's above-threshold character predictions are wrong. Schema validation alone cannot make them correct. A span application could expose uncertain regions, but such an interface needs an explicit contract; the framework must not silently weaken whole-parser acceptance.

## Training cost

Both runs use the full corpus for eight epochs on an Apple M2 with 8 GiB RAM. Reported process time includes data loading, optimization, validation checkpoint selection, serialization and final test evaluation.

| Model           | Parameters | Native float32 Burn record | Optimizer time | Process wall time | Peak resident memory |
| --------------- | ---------: | -------------------------: | -------------: | ----------------: | -------------------: |
| Local parts     |     32,041 |              128,445 bytes |      685.505 s |         714.647 s |    643,596,288 bytes |
| Recurrent parts |     36,233 |              145,333 bytes |    1,021.384 s |       1,059.796 s |    881,049,600 bytes |

These weight sizes exclude encoders, metadata, packaging and a shared runtime. The models and repository checks overlapped on a development machine, so the timings describe observed training cost rather than isolated comparative performance. A separate confidence assessment reloads each saved checkpoint through Burn and reproduces its complete test confusion matrix exactly.

## Contract under investigation

The potential framework additions belong to two separate layers:

- An explicit encoder maps offset-preserving parts to bounded categorical feature IDs. Hash collisions are allowed and documented. It must not require a complete vocabulary or assign semantic labels.
- A separate recurrent token classifier consumes those features, preserves sequence boundaries and predicts one label distribution per part. Its settings should not become architecture switches on the existing fixed-window classifier.

The application continues to own supervision, decoding and schema validation. Feature preparation remains TypeScript. Burn owns embeddings, the recurrence, optimization, records and execution. A useful public design also needs an explicit sequence-length contract and an acceptance policy suitable for partial span predictions. Recognition evidence alone does not establish either contract.

This is a prototype, not a proposed compatibility commitment. The research executable has no published artifact format or WASM loader. Weight size is the native float32 Burn record size, not a packaged browser download. Native measurements must not be described as browser latency or accepted parser output.

## Reproduction

Use the corpus and upstream checkout documented in [matchbox-lexer](https://github.com/alexpatow/matchbox-lexer). Set `UPSTREAM` to the pinned gpu-lexer checkout and `CORPUS` to the frozen JSONL directory. Every output directory must be new. Generated inputs, checkpoints and logs remain ignored.

```sh
mkdir -p .matchbox/research
bun scripts/sequence-research/parts/prepare.ts "$UPSTREAM" "$CORPUS" .matchbox/research/parts
bun scripts/rust.ts cargo build -p matchbox-engine --features training --example context-research --release
bun scripts/sequence-research/parts/run.ts .matchbox/research/parts .matchbox/research/local local
bun scripts/sequence-research/parts/run.ts .matchbox/research/parts .matchbox/research/recurrent recurrent
bun scripts/rust.ts cargo test -p matchbox-engine --features training --example context-research
bun scripts/rust.ts cargo build -p matchbox-engine --features training --example context-assess --release
target/release/examples/context-assess .matchbox/research/local .matchbox/research/parts/test.jsonl .matchbox/research/local/confidence.json
target/release/examples/context-assess .matchbox/research/recurrent .matchbox/research/parts/test.jsonl .matchbox/research/recurrent/confidence.json
bun scripts/sequence-research/parts/summarize.ts .matchbox/research/local .matchbox/research/recurrent .matchbox/research/evidence.json
```

The measurement wrapper uses macOS `/usr/bin/time -l`. The Rust executable itself is portable. Reports contain data hashes, feature identity, per-epoch validation scores, selected checkpoint, confusion matrices, document-level counts, weight size, fit time, evaluation time, process wall time and peak resident memory. Preparation and compilation are excluded from trainer timing. These measurements ran concurrently with the other candidate and repository checks on a development machine; they are not isolated speed comparisons. Sampling intervals describe document uncertainty, not training-seed variation.
