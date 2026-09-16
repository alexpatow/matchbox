---
"@matchbox-ai/core": minor
"@matchbox-ai/train": minor
"matchbox-ai": minor
---

Add recurrent token classification with explicit text-part encoding and span supervision. Train whole-document Burn models, select checkpoints on validation label agreement, and package native/WASM-verified artifacts through the CLI. Generated wrappers and the React hook support opt-in partial parsing with uncertain source ranges while preserving existing parser behavior and classifier APIs.

Add experimental opt-in `parse(input, { gpu: true })` for recurrent classifiers, using a separately loaded Burn WebGPU runtime and the same weights and validation contract.
