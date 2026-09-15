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
