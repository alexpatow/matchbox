# Project structure

Each task lives under `matchbox/`. The CLI discovers this layout:

```text
my-app/
  src/
  scripts/generate-data.ts
  matchbox/money/
    parser.ts
    pipeline.ts
    recipe.ts
    decode/
      decode.ts
      number-words.ts
    data/train.jsonl
    data/train-spans.json
    evals/validation.jsonl
    evals/test.jsonl
  .matchbox/money/
    model.matchbox
    model.ts
    model.d.matchbox.ts
    report.json
```

`parser.ts` defines the schema; `pipeline.ts` chooses the strategy. Token classifiers also need a training recipe and browser-safe decoder. Field classifiers need neither. Annotation files such as `train-spans.json` are recipe-owned, not discovered by the framework.

`.matchbox/` holds generated artifacts and is ignored by Git. Put data generators in project-level `scripts/` and preserve evals independently.

## Numeric feature tasks

The sketch task replaces token supervision and decoding with an explicit encoder:

```text
matchbox/shapes/
  parser.ts
  pipeline.ts
  encode.ts
  recognize.ts
  geometry/
    normalize.ts
    fit.ts
  data/train.jsonl
  evals/validation.jsonl
  evals/test.jsonl
```

`encode.ts` exports a [NumericEncoder](primitives/feature-classifier.md) used during training and inference. `recognize.ts` and `geometry/` are application-owned helpers for converting a predicted class into fitted geometry; the framework does not discover them.

## Named entry points

Use `X.ts` for a small module or `X/X.ts` with helpers alongside it. For example, `decode.ts` can become `decode/decode.ts`, and `encode.ts` can become `encode/encode.ts` without changing the pipeline. Both forms existing at once is an error; `index.ts` is not discovered.

Import authored modules directly. Keep shared domain helpers in a named task folder such as `countries/`. Applications import the generated `.matchbox/<task>/model.ts`, which references the parser and any encoder or decoder without importing the pipeline or training recipe.

## Path overrides

Add `matchbox/<task>/matchbox.config.ts` only when needed:

```ts
import type { TrainingConfig } from "@matchbox-ai/train";

export default {
  train: "../../datasets/money-training.jsonl",
  validation: "../../datasets/money-validation.jsonl",
  eval: "../../datasets/money-test.jsonl",
} satisfies TrainingConfig;
```

Paths resolve relative to the config directory. Config acceptance values override the pipeline. JSON config is not supported. See [configuration](reference/configuration.md) for all fields.

With multiple tasks, pass a task name, directory or config path to the CLI. Only interactive `dev` offers a task picker.
