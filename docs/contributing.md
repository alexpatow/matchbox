# Contributing

Matchbox uses a shared Rust engine for native training and browser inference, with TypeScript authoring and application APIs.

## Project structure

```text
Cargo.toml                         # The Rust workspace owns the shared dependency versions.
crates/
  matchbox-engine/src/             # Burn model, training and record serialization.
  matchbox-node/src/               # Node-API training adapter and native parity checks.
  matchbox-wasm/src/               # Browser inference adapter.
packages/
  core/src/runtime/burn/           # Loading, typed prediction and disposal.
  train/src/native/                # TypeScript calls into the native addon.
  cli/                            # Existing commands and workbench.
scripts/
  build-rust.ts                   # Builds the native addon and browser WASM module.
  copy-rust.ts                    # Copies binaries into npm package output.
```

TypeScript continues to own task schemas, tokenization, authored supervision, decoding and validation. Burn owns the embedding network, autodiff, Adam, model records and execution. The adapters share the same model implementation. They do not implement a separate inference engine.

A contributor compiles the native addon and WASM runtime once. Training produces model data, without compiling Rust for each task. Published packages bundle native binaries for the supported platforms.

## Local development

Install Bun and Rust through rustup or Homebrew. The repository discovers Rust tools from PATH, Homebrew rustup and the Cargo bin directory without changing your shell configuration. The checked-in toolchain file pins Rust and requests the WASM target.

```sh
bun install --frozen-lockfile
bun run setup:rust
bun run dev
bun run check
MATCHBOX_PREBUILT=1 bun run test:browser
bun run eval:examples
```

`bun run setup:rust` is a one-time contributor setup for the pinned wasm-bindgen CLI. Subsequent `bun run dev`, builds and checks locate the installed tools automatically. Package consumers use bundled prebuilds and do not need Rust.

Generated native binaries, WASM output, Cargo build output and model artifacts are ignored by Git. `Cargo.lock` pins Rust dependencies. `bun run check` includes Rust formatting, Clippy and engine tests.

See [native package distribution](native-packages.md) for platform coverage and release verification.

## Diagnose sequence exports

To inspect native/WASM prediction differences with an installed consumer's binaries, run:

```sh
bun scripts/diagnose-sequence-export.ts \
  /path/to/application \
  /path/to/application/matchbox/task \
  /path/to/dataset \
  .matchbox/export-diagnostic
```

The dataset directory must contain `train.jsonl` and `validation.jsonl`. An optional final integer limits training records. The runner refuses an existing output directory and saves weights and fit metadata before comparing predictions. Reports include checked tokens, differing labels and confidence drift without source text. This contributor tool uses framework internals; it does not package an application model. Generated files stay ignored.

## Sequence context experiments

The framework research tools under `scripts/sequence-research/` exercise a local native/WASM build against an independently prepared task and frozen corpus. They do not replace testing the published packages in a consumer application. Run `bun run build:packages` first.

```sh
bun scripts/sequence-research/train.ts "$TASK" "$CORPUS" "$NEW_RUN" preserve 1
bun scripts/sequence-research/assess.ts "$TASK" "$NEW_RUN/model.json" "$CORPUS/validation.jsonl" "$NEW_RUN/assessment.json"
bun scripts/sequence-research/browser.ts "$NEW_RUN/model.json" "$CORPUS/validation.jsonl" "$NEW_RUN/browser.json"
```

`TASK` contains the parser, recipe, and decoder. `CORPUS` contains frozen `train.jsonl` and `validation.jsonl`. `NEW_RUN` must be a new directory under ignored `.matchbox/`; its parent must exist. The research recipe must support deriving labels from held-out input/output pairs as well as training examples. Training reads only the training and validation files. Assessment defaults to validation. After choosing a model, pass `test.jsonl` and a final `test` argument to `assess.ts` for a separate final report. Do not adjust the model based on that result.

Compare lowercase/radius-one, preserved-case/radius-one, and lowercase/wider-radius models before testing their combination. Keep data, supervision, optimizer, seed, epochs, and evaluation method fixed. The vocabulary is fitted on training data only. Save weights before evaluation so an export or measurement failure does not require another training run.

Reports distinguish diagnostic non-whitespace token accuracy from whole-parser acceptance and exact output accuracy. Native/WASM checks retain the normal confidence tolerance, label agreement, and acceptance agreement requirements. Browser timings measure diagnostic inference on fixed validation prefixes with five warmups and thirty calls per length; they exclude decoding and must not be presented as accepted-result throughput. Initialization excludes JavaScript import and model fetch.

For a paired document-level bootstrap interval, run `bun scripts/sequence-research/compare.ts "$BASELINE_ASSESSMENT" "$CANDIDATE_ASSESSMENT" "$NEW_COMPARISON"`. It requires identical evaluation hashes and token counts. Its uncertainty interval covers document sampling, not training-seed variation.

Training reports record preparation and native fit wall time separately, data hashes, model size, loss, and machine details. Use an operating-system resource monitor to record peak resident memory and total process time. Single-seed runs and single-machine timings establish an initial comparison, not a production quality or speed guarantee. Preserve immutable measurements and keep run commentary outside the repository.

See the [character encoding and context measurements](research/sequence-context.md) for a full-corpus example of this evaluation protocol.
