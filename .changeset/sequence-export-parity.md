---
"@matchbox-ai/train": patch
---

Verify sequence exports with an explicit 0.0001 absolute confidence tolerance for float32 predictions. Continue rejecting every label disagreement, and now reject differences that cross the model acceptance threshold. Record the measured drift, tolerance, checked token count and acceptance disagreements in exportParity and include diagnostic details when verification fails.
