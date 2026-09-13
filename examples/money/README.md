# Train a money recognizer

This example trains a tiny contextual token model from 1,596 annotated examples. It recognizes amounts, currencies, and modifiers, then applies an application-owned deterministic decoder.

From the repository root:

```sh
bun run build:packages
bun run matchbox train examples/money/matchbox.config.ts
bun run matchbox eval examples/money/matchbox.config.ts
```

`generate.ts` creates the training JSONL and exact token labels in `data/train-spans.json`. It leaves validation and evaluation files untouched. To add handwritten training data, add the corresponding labels too. Training checks that these labels decode to the provided output.

The supported domain is English text, nonnegative money, English decimal notation, number words below 100, thousand/million modifiers, and explicit EUR/USD/GBP/SEK. Unknown words, bare dollar symbols, unsupported formats, and ambiguous multiple amounts abstain. The learned model distinguishes monetary numbers from nearby invoice IDs and years in the controlled examples.

See the [training guide](../../docs/neural-training.md) for results, limits, artifact format, supervision details, and the next experiments. The React/Vite app hosts an interactive example at `/training`.
