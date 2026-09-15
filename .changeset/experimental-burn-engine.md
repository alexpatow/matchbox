---
"@matchbox-ai/core": minor
"@matchbox-ai/train": minor
"matchbox-ai": minor
---

Prototype Burn native training and WebAssembly inference for sequence parsers and record classifiers while preserving the TypeScript API. Earlier artifacts require retraining. TensorFlow dependencies are removed. Native distribution bundles prebuilds verified by the release matrix.

Expand the examples with explicit training-language variations and retain measured accuracy limitations. Keep workbench model revisions isolated during reloads.

Remove the single-choice `wordTokens()` pipeline setting and task config `formatVersion`. Training report format 2 replaces duplicate `float` and `quantized` results with `evaluation`. Report parameter counts from Burn and derive the wasm-bindgen installer version from its Cargo dependency pin.

Remove untrained and shuffled-label control runs from training and the example UI. Retain task evaluations and serialization checks. Expand authored money, time and filter training coverage without adding runtime parsing rules.
