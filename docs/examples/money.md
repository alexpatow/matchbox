# Money parsing

The money template trains a token recognizer for amounts, currencies, and multipliers. Its decoder converts recognized number words and applies arithmetic.

```sh
bunx matchbox-ai init money --template money
bunx matchbox-ai train money
bunx matchbox-ai dev money
```

Try `invoice 31415 totals € 28.65`, `in 2026 we paid USD 59.20`, or `around twenty six grand in euros`. The first two require distinguishing money from other numbers.

The output is `{ amount: number, currency: "EUR" | "USD" | "GBP" | "SEK", approximate: boolean }`. In this example `$` means USD. English number words below one hundred are supported by application code. Conflicting currencies and undecodable amounts cause uncertainty.

Read `parser.ts` for the output contract, `pipeline.ts` for the learning strategy, `recipe.ts` for supervision, and `decode/decode.ts` for normalization. Add training annotations when adding examples. Evals stay independent.

The recognizer is learned; number conversion and multiplication are authored. Training a different domain does not automatically inherit these rules.

Training includes explicit neutral spans, rejection examples, and unknown-token masking. These choices are visible in the recipe and generator. The original test cases are development regressions. The frozen `evals/generalization.json` cases compare new contexts and rejection behavior against a nearest-currency rule baseline and an empirical token/window lookup. See [the example audit](../example-evaluation.md).
