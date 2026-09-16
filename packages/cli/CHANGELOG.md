# matchbox-ai

## 0.3.0

### Patch Changes

- Updated dependencies [6158277]
  - @matchbox-ai/core@0.3.0
  - @matchbox-ai/train@0.3.0

## 0.2.2

### Patch Changes

- Updated dependencies [833edc6]
  - @matchbox-ai/train@0.2.2
  - @matchbox-ai/core@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies [3351f13]
  - @matchbox-ai/train@0.2.1
  - @matchbox-ai/core@0.2.1

## 0.2.0

### Minor Changes

- 471f07c: Prototype Burn native training and WebAssembly inference for sequence parsers and record classifiers while preserving the TypeScript API. Earlier artifacts require retraining. TensorFlow dependencies are removed. Native distribution bundles prebuilds verified by the release matrix.

  Expand the examples with explicit training-language variations and retain measured accuracy limitations. Keep workbench model revisions isolated during reloads.

  Remove the single-choice `wordTokens()` pipeline setting and task config `formatVersion`. Training report format 2 replaces duplicate `float` and `quantized` results with `evaluation`. Report parameter counts from Burn and derive the wasm-bindgen installer version from its Cargo dependency pin.

  Remove untrained and shuffled-label control runs from training and the example UI. Retain task evaluations and serialization checks. Expand authored money, time and filter training coverage without adding runtime parsing rules.

### Patch Changes

- 0c54a55: Add explicit rejection supervision and optional unknown-token masking to sequence recipes. Improve training order, synchronize the money scaffold, and document independent example evaluations and uncalibrated recognition scores.
- a08991e: Support named task entry points as X.ts or X/X.ts. Token classifiers discover recipe and decode modules by convention while preserving explicit path overrides. Update CLI scaffolding, examples, and documentation to keep task contracts and their helpers out of generic lib folders.
- 54bb6a1: Refactor conditional logic and control-flow bodies to meet stricter readability lint rules across the runtime, training code and CLI. Preserve existing parsing and training behavior.
- 535cf49: Remove automatic baseline discovery, configuration and scoring, and remove rule parsers from the money scaffold. Model correctness, uncertainty and export checks remain in place.
- 4846b0b: Rewrite the bundled getting-started guide and add public API, configuration, token supervision, and complete CLI references.
- Updated dependencies [471f07c]
- Updated dependencies [0c54a55]
- Updated dependencies [a08991e]
- Updated dependencies [fb1a77f]
- Updated dependencies [54bb6a1]
- Updated dependencies [535cf49]
- Updated dependencies [4846b0b]
  - @matchbox-ai/core@0.2.0
  - @matchbox-ai/train@0.2.0

## 0.1.0

### Minor Changes

- b1374ca: Release the first examples-to-browser toolchain, including typed local inference, explicit TensorFlow training pipelines, and the matchbox-ai CLI with task scaffolding and a browser workbench.

### Patch Changes

- Updated dependencies [b1374ca]
  - @matchbox-ai/core@0.1.0
  - @matchbox-ai/train@0.1.0
