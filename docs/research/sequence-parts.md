# Part features and recurrent context

This experiment separates input representation from learned sequence context. It uses native Burn research models and the frozen lexer corpus. It does not change the published parser, acceptance policy, CLI, or browser runtime.

## Method

The source corpus is `full-clean-v1`: 4,174 training documents, 336 validation documents and 1,915 test documents. Every document is used in full, including the longest sequences. No chunks, token sampling, vocabulary fitting on held-out data, or source-specific syntax rules are introduced.

The encoder comes from the pinned [gpu-lexer source](https://github.com/vercel-labs/gpu-lexer/tree/1e514fd681e31d6b19296f985fb01d8fdc0ae74f). It splits words, horizontal whitespace, newlines and symbols, then emits categorical part kind, length, edge characters, hashed spelling, shape and boundary features. The adapter explicitly excludes the upstream `pairCode` feature categories. Its remaining neighboring-symbol features use a generic hash. The upstream source is read from a separate checkout and is not bundled with Matchbox.

Labels remain the same nine Shiki-derived display classes. A part can contain characters with different teacher labels. The target preserves their complete class-count distribution rather than choosing a majority label. Loss and evaluation count Unicode code points excluding whitespace. Whitespace remains visible to the model but contributes no loss. This differs from the earlier character model's training supervision, so the character-to-part comparison is not an isolated architecture ablation.

Both candidates sum 32-dimensional sparse feature embeddings and use a five-part local neighborhood, a 32-channel projection, a 64-unit classifier and nine output classes. The recurrent candidate adds learned affine state updates in both directions, with a learned projection back into the local representation. Burn evaluates an associative prefix scan; document boundaries reset state, batching and padding do not. The local candidate uses identical features and supervision without recurrent state. Neither includes gpu-lexer's hierarchy, auxiliary lexical-state targets, quantization-aware training, or pretrained weights.

Both models use seed 42, Adam at 0.003 and eight full epochs. Documents are grouped by length into batches targeting 4,096 padded parts, with a longer document processed alone. Batch order is shuffled deterministically each epoch. Each model selects its checkpoint using validation label agreement, then evaluates the frozen test set. Test scores do not select hyperparameters or checkpoints.

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
