# money

This self-contained example is authored under matchbox/money/. parser.ts defines the output contract; pipeline.ts explicitly selects the learning strategy and acceptance gates. Training examples live in data/, and independent validation/test data lives in evals/.

```sh
cd examples/money
bunx matchbox-ai train money
bunx matchbox-ai eval money
bunx matchbox-ai dev money
```

Generated artifacts are written to .matchbox/money/model.matchbox, with a typed wrapper and report.json. The shared browser demo lives in apps/playground.

tokenClassifier uses recipe.ts for training supervision and decode/decode.ts for browser-safe output decoding. Any domain normalization is visible application code. The model learns recognition, and the decoder validates or normalizes those predictions.

The project-level scripts/generate-data.ts regenerates training data only. It preserves independent evaluation fixtures.
