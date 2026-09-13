# Money with an explicit pipeline

This is the original money example, reorganized to make its application-owned logic visible. Its training, validation, and evaluation data are preserved.

```text
parser/
  parser.ts              # Defines the output schema.
  recipe.ts              # Supplies token supervision during training.
  decode.ts              # Assembles recognized spans and applies normalization.
  lib/number-words.ts     # Contains the handwritten number-word mapping.
  data/train.jsonl
  data/train-spans.json
evals/
  validation.jsonl
  evals.jsonl
  baseline.ts
  challenges.json
```

```bash
cd examples/money-pipeline
bun run train
bun ../../packages/train/dist/cli.js
```

The model learns contextual token labels, including whether a number is an invoice ID or an amount. Application code maps English number words to numeric values, applies thousand/million multipliers, rounds monetary arithmetic, and builds the typed output. In this example, the dollar symbol means USD. The supported normalizer handles nonnegative numbers, conventional comma grouping, at most two decimal places, and English number words below one hundred.

`generate.ts` recreates training examples and their annotations under `parser/data/`. It never rewrites `evals/`. Hand-authored examples need corresponding recipe supervision. `parser/recipe.ts` and `parser/decode.ts` are discovered as a pair; `parser/lib/` is ordinary imported code. The root config only overrides size and accuracy budgets.

Compare this to [money-simple](../money-simple/README.md), which learns field values directly and has no handwritten runtime meanings. Both are exposed in the browser demo at `/training`.
