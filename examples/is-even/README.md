# Train a parity model

This example checks the complete training/export/browser path using digit strings and `{ even: boolean }` outputs. The model learns weights from examples. Modulo is used only to generate training labels and to implement the comparison baseline.

From the repository root:

```sh
bun run build:packages
bun run matchbox train examples/is-even/matchbox.config.ts
```

`data/train.jsonl`, `validation.jsonl`, and `evals.jsonl` are disjoint number ranges. Half the evaluation inputs are much longer strings. `generate.ts` recreates only the training set and preserves the committed validation and evaluation fixtures. `recipe.ts` supervises the final token of each string. The context-window model therefore has an explicit positional bias; this is an educational pipeline check, not a useful replacement for modulo.

The training report includes an untrained comparison and a separately fitted shuffled-label control. See the [training guide](../../docs/neural-training.md) and the `/training` page in the Vite example.
