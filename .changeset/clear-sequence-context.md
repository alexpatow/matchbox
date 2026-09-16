---
"@matchbox-ai/core": minor
"@matchbox-ai/train": minor
---

Add explicit case preservation to token recipes and configurable context radius to token classifiers. Native Burn training and WASM inference use the same serialized encoding and window shape. Existing recipes retain lowercase keys and a radius of one, and the runtime continues to read version 3 sequence artifacts.

Store training windows in packed integer arrays to limit preparation memory for larger corpora and wider contexts.
