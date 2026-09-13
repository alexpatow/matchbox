# money-simple

This self-contained example is authored under matchbox/money/. parser.ts defines the output contract; pipeline.ts explicitly selects the learning strategy and acceptance gates. Training examples live in data/, and independent validation/test data lives in evals/.

```sh
cd examples/money-simple
bunx matchbox train money
bunx matchbox eval money
bunx matchbox dev money
```

Generated artifacts are written to .matchbox/money/model.matchbox, with a typed wrapper and report.json. The shared browser demo lives in apps/playground.

fieldClassifier learns finite field values without dictionaries or normalization. It ignores word order and cannot emit unseen numeric values. Unknown vocabulary leads to uncertainty. Confidence is uncalibrated.
