# Examples

The two money examples expose the tradeoff between learning structured values directly and providing an explicit recognition/normalization pipeline. Both train real TensorFlow weights and run locally through the same CLI, generated TypeScript API, and React demo at `/training`.

| Example                                    | Application authors supply                                                          | Current capability                                                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [money-simple](money-simple/README.md)     | A Zod schema and input/output examples.                                             | It learns word meanings and structured field values, with no dictionary or decoder. It emits only field values observed in training. |
| [money-pipeline](money-pipeline/README.md) | A schema, examples, token supervision, a decoder, and optional baseline/challenges. | It learns contextual token recognition and uses visible application rules to normalize unseen numeric amounts.                       |
| [is-even](is-even/README.md)               | An explicit sequence recipe and decoder.                                            | It verifies the training/export path; ordinary modulo remains the appropriate application implementation.                            |
| [filters](filters/README.md)               | An explicit sequence pipeline and application-owned AST compiler.                   | It demonstrates browser-local filter chips and customer-table filtering.                                                             |

Both money examples use the same folder conventions:

```text
money-simple/                 money-pipeline/
  parser/                      parser/
    parser.ts                    parser.ts
    data/train.jsonl             recipe.ts
                                 decode.ts
                                 lib/number-words.ts
                                 data/train.jsonl
                                 data/train-spans.json
  evals/                       evals/
    validation.jsonl             validation.jsonl
    evals.jsonl                  evals.jsonl
                                 baseline.ts
                                 challenges.json
  .matchbox/                   .matchbox/
```

Generated `.matchbox/` contents are ignored by Git. The full pipeline's config only overrides evaluation and size budgets. The simple example needs no config. The CLI discovers everything else by location. See [the CLI guide](../docs/cli.md).

## What the comparison proves

The local simple model has 1,035 parameters and a 4,670-byte JSON artifact. The pipeline model has 1,049 parameters and a 4,934-byte artifact, plus its separate application decoder/normalizer code. Both pass the same 20-example simple evaluation corpus. The pipeline also retains and passes its original 26-example corpus, including unseen decimal amounts and unrelated invoice numbers. Those fixtures were preserved byte for byte during the folder move.

The simple model uses a bag-of-words MLP with a categorical prediction for each output field. Literal token vocabulary and output-value domains come exclusively from training data. It has no embedded meanings for fifteen, grand, dollars, or approximation. A regression test teaches the invented word dax to mean 15, then 20, by changing only training outputs. The output domain and runtime code stay fixed, while learned weights and predictions change.

These are controlled, synthetic pipeline checks, not evidence of broad language understanding. The simple model ignores word order, cannot emit unseen numeric values, can be confidently wrong on novel combinations of known words, and abstains on unknown tokens. Its small corpus covers five amounts and four currencies. The full model's broader amount handling comes from application code, not learned arithmetic. Evals should grow independently as actual application requirements expand.
