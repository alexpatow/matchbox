---
"@matchbox-ai/train": patch
"@matchbox-ai/core": patch
---

Allow sequence training datasets larger than one million token windows. Keep the inference batch limit and report an explicit error when it is exceeded. Training still uses the existing Burn minibatches and validates window shape, vocabulary IDs and labels.
