# Money parsing

The money template trains a token recognizer for amounts, currencies, and multipliers. Its decoder converts recognized number words and applies arithmetic.

```sh
bunx matchbox-ai init money --template money
bunx matchbox-ai train money
bunx matchbox-ai dev money
```

Try `$15`, `83k EUR`, or `around twenty six grand in euros`.

The output is `{ amount: number, currency: "EUR" | "USD" | "GBP" | "SEK", approximate: boolean }`. In this example `$` means USD. English number words below one hundred are supported by application code. Conflicting currencies and undecodable amounts cause uncertainty.

Read `parser.ts` for the output contract, `pipeline.ts` for the learning strategy, `lib/recipe.ts` for supervision, and `lib/decode.ts` for normalization. Add training annotations when adding examples. Evals stay independent.

The recognizer is learned; number conversion and multiplication are authored. Training a different domain does not automatically inherit these rules.
