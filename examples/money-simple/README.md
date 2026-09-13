# Money with a simple pipeline

This example learns `{ amount, currency, approximate }` directly from input/output examples. It has no recipe, decoder, aliases, or money normalizer. `parser/parser.ts` defines the output schema; `parser/data/train.jsonl` teaches meanings. Validation and eval fixtures live independently in `evals/`.

```bash
cd examples/money-simple
bun run train
bun ../../packages/train/dist/cli.js
```

Type `around fifteen grand euros`, or use `/inspect` to see per-field predictions. Use `/save <correct JSON>` after an input to explicitly add a training example, then `/train`. Merely running inference never saves data. The saved model imports through `.matchbox/parser.matchbox` in a Vite app using the Matchbox plugin, or through the generated `.matchbox/parser.ts` wrapper.

The first architecture learns a finite vocabulary of values for each field. It can combine fields and learn new expression meanings through examples, but it cannot output an amount absent from its training value domain. It ignores word order. `123.45 euros` abstains because that numeric token is unseen. The confidence score is uncalibrated.

See [the comparison](../README.md) and the [explicit pipeline](../money-pipeline/README.md), which trades application-owned normalization rules for broader numeric coverage.
