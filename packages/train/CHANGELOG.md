# @matchbox-ai/train

## 0.3.0

### Minor Changes

- 6158277: Add explicit case preservation to token recipes and configurable context radius to token classifiers. Native Burn training and WASM inference use the same serialized encoding and window shape. Existing recipes retain lowercase keys and a radius of one, and the runtime continues to read version 3 sequence artifacts.

  Store training windows in packed integer arrays to limit preparation memory for larger corpora and wider contexts.

### Patch Changes

- Updated dependencies [6158277]
  - @matchbox-ai/core@0.3.0

## 0.2.2

### Patch Changes

- 833edc6: Verify sequence exports with an explicit 0.0001 absolute confidence tolerance for float32 predictions. Continue rejecting every label disagreement, and now reject differences that cross the model acceptance threshold. Record the measured drift, tolerance, checked token count and acceptance disagreements in exportParity and include diagnostic details when verification fails.
- @matchbox-ai/core@0.2.2

## 0.2.1

### Patch Changes

- 3351f13: Allow sequence training datasets larger than one million token windows. Keep the inference batch limit and report an explicit error when it is exceeded. Training still uses the existing Burn minibatches and validates window shape, vocabulary IDs and labels.
- Updated dependencies [3351f13]
  - @matchbox-ai/core@0.2.1

## 0.2.0

### Minor Changes

- 471f07c: Prototype Burn native training and WebAssembly inference for sequence parsers and record classifiers while preserving the TypeScript API. Earlier artifacts require retraining. TensorFlow dependencies are removed. Native distribution bundles prebuilds verified by the release matrix.

  Expand the examples with explicit training-language variations and retain measured accuracy limitations. Keep workbench model revisions isolated during reloads.

  Remove the single-choice `wordTokens()` pipeline setting and task config `formatVersion`. Training report format 2 replaces duplicate `float` and `quantized` results with `evaluation`. Report parameter counts from Burn and derive the wasm-bindgen installer version from its Cargo dependency pin.

  Remove untrained and shuffled-label control runs from training and the example UI. Retain task evaluations and serialization checks. Expand authored money, time and filter training coverage without adding runtime parsing rules.

- fb1a77f: Bundle native training binaries for macOS, Windows and Linux glibc/musl on x64 and ARM64. Select the installed binary automatically without postinstall downloads or compilation. Verify packed installations and require the complete platform matrix before releasing.

### Patch Changes

- 0c54a55: Add explicit rejection supervision and optional unknown-token masking to sequence recipes. Improve training order, synchronize the money scaffold, and document independent example evaluations and uncalibrated recognition scores.
- a08991e: Support named task entry points as X.ts or X/X.ts. Token classifiers discover recipe and decode modules by convention while preserving explicit path overrides. Update CLI scaffolding, examples, and documentation to keep task contracts and their helpers out of generic lib folders.
- 54bb6a1: Refactor conditional logic and control-flow bodies to meet stricter readability lint rules across the runtime, training code and CLI. Preserve existing parsing and training behavior.
- 535cf49: Remove automatic baseline discovery, configuration and scoring, and remove rule parsers from the money scaffold. Model correctness, uncertainty and export checks remain in place.
- 4846b0b: Rewrite the bundled getting-started guide and add public API, configuration, token supervision, and complete CLI references.
- Updated dependencies [471f07c]
- Updated dependencies [0c54a55]
- Updated dependencies [a08991e]
- Updated dependencies [54bb6a1]
- Updated dependencies [4846b0b]
  - @matchbox-ai/core@0.2.0

## 0.1.0

### Minor Changes

- b1374ca: Release the first examples-to-browser toolchain, including typed local inference, explicit TensorFlow training pipelines, and the matchbox-ai CLI with task scaffolding and a browser workbench.

### Patch Changes

- Updated dependencies [b1374ca]
  - @matchbox-ai/core@0.1.0
