# Burn experiment

This branch tests a Rust engine behind the existing TypeScript parser and training interfaces. It is an experiment, not a release candidate. All four sequence examples train with Burn and run through Burn in WebAssembly. The structured record classifier still uses TensorFlow.

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

A contributor compiles the native addon and WASM runtime once. Training produces model data, without compiling Rust for each task. Consumer distribution will require prebuilt native binaries for supported platforms; this branch only packages the build host's binary.

## Running the experiment

Install Bun and Rust through rustup or Homebrew. The repository discovers Rust tools from PATH, Homebrew rustup and the Cargo bin directory without changing your shell configuration. The checked-in toolchain file pins Rust and requests the WASM target.

```sh
bun install --frozen-lockfile
bun run setup:rust
bun run dev
bun run check
MATCHBOX_PREBUILT=1 bun run test:browser
bun run eval:examples
```

`bun run setup:rust` is a one-time contributor setup for the pinned wasm-bindgen CLI. Subsequent `bun run dev`, builds and checks locate the installed tools automatically. Consumers will use prebuilt packages once native distribution is implemented.

Generated native binaries, WASM output, Cargo build output and model artifacts are ignored by Git. `Cargo.lock` pins Rust dependencies. `bun run check` includes Rust formatting, Clippy and engine tests.

## Measurements

These are local measurements from the experiment, not production guarantees. Model bytes include JSON metadata, vocabulary and a base64-encoded float32 Burn record. The shared runtime is additional.

| Example | Parameters | Artifact bytes | Regression exact match | Frozen audit exact match |
| ------- | ---------: | -------------: | ---------------------: | -----------------------: |
| is-even |        530 |          3,898 |                100/100 |                      8/8 |
| Money   |      1,178 |          8,088 |                  27/27 |                    17/20 |
| Time    |      1,159 |          8,392 |                  12/12 |                    15/20 |
| Filters |      7,680 |         58,056 |                282/282 |                    13/16 |

The frozen audit includes expected abstentions. Exact match counts those as correct. Money falsely accepted two of eight negative cases, compared with one in the previous TensorFlow report. Its previous audit score was 19/20. The other three audit scores were unchanged. No audit cases were used to tune this port. See [the original audit](../example-evaluation.md) for its provenance and limitations.

Native and WASM predictions had zero label disagreements across the export probes. The largest confidence difference was approximately 1.2e-7. The model initialization was adjusted to preserve the prior embedding and dense-layer initialization choices during the port; this does not make training numerically identical across engines.

The WASM binary is 649,889 bytes uncompressed and 174,908 bytes with gzip, excluding JavaScript glue. The money browser benchmark measured 0.1 ms p95 over 300 samples in local Chromium. Its p50 rounded to zero at the browser timer's resolution, so it cannot establish a sub-0.1 ms latency. First parse measured approximately 59 ms in that run, including runtime loading. Mobile Chromium results use desktop emulation, not a physical phone.

Validation passed 112 TypeScript tests, two Rust tests and 18 browser tests. Browser coverage includes loading the WASM asset, inference after network access is blocked, and training through a scaffolded workbench. Deterministic packaging and held-out-label independence tests also pass on this host.

## Remaining decisions

The sequence artifact format is version 3 and requires retraining version 2 TensorFlow sequence artifacts. The public parser API is unchanged.

This experiment uses float32 records. The existing report's `quantized` field contains the same float32 model for interface compatibility; it does not represent quantization. Artifact sizes must not be presented as an equivalent int8 comparison.

The native addon needs a platform distribution strategy before release. Cross-platform reproducibility and native installation on other operating systems remain unverified. Deployment environments need Rust build tooling or prebuilt packages. The release workflow has not been converted for this experiment, and this branch must not be published.

The record classifier has not been ported. TensorFlow therefore remains a dependency, loaded only on that path. This branch proves the shared native-training and browser-inference boundary for sequence models; it does not establish better generalization or justify a complete migration by itself.
