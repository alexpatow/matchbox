# Project structure

A task is a directory under matchbox/. Each task has its own schema, explicit learning pipeline, training data, and independent evaluation data.

```text
my-app/
  src/
  scripts/generate-data.ts     # Optional project tooling.
  matchbox/
    money/
      parser.ts
      pipeline.ts
      data/train.jsonl
      evals/validation.jsonl
      evals/test.jsonl
      recipe.ts               # Token-classifier supervision.
      decode/
        decode.ts             # Browser-side output construction.
        number-words.ts       # Decoder helper.
  .matchbox/money/
    model.matchbox
    model.ts
    model.d.matchbox.ts
    report.json
```

The CLI discovers these paths. Multiple tasks require an explicit name; it never silently chooses the first one. Commands can also target a project directory, task directory, or explicit matchbox.config.ts. A task-local config may override paths; field-classifier tasks need parser and pipeline modules; token classifiers also need recipe and decode modules.

Generated artifacts are ignored. Validation gates packaging; test data does not select the model. Data generators live in the project-level scripts/ directory and write only matchbox/<task>/data/, preserving evals/ independently.

## Optional task configuration

Use `matchbox/<task>/matchbox.config.ts` when your files live outside the conventional layout. Paths resolve relative to that task directory:

```ts
export default {
  train: "../../datasets/money-training.jsonl",
  validation: "../../datasets/money-validation.jsonl",
  eval: "../../datasets/money-test.jsonl",
};
```

The config overrides paths and acceptance settings. Keep the encoder, supervision, prediction strategy, and decoder explicit in `pipeline.ts`. The current loader supports TypeScript configuration; there is no separate JSON config format.

## Named entry points

Parser, pipeline, recipe, and decode modules each use the same convention: `X.ts` for a small module, or `X/X.ts` alongside supporting files. For example, `decode.ts` can become `decode/decode.ts` without changing `tokenClassifier()` in the pipeline. Matchbox rejects both forms existing at once. No `index.ts` is required or discovered.

`tokenClassifier()` discovers the recipe and decoder by name. The recipe still explicitly defines tokenization, labels, readout, and supervision. The decoder still owns application-specific output construction. File discovery makes no learning or normalization choices.

Keep helpers with the module that owns them. Shared domain code can have its own named folder: the filter example's `countries/` is used by the schema, training recipe, browser decoder. It is ordinary application code, not another framework-discovered entry point.

Import named authored modules directly, such as `./decode/decode`. Task directories do not need a barrel exporting training and runtime internals together. Applications consume the generated `.matchbox/<task>/model.ts` wrapper.

Generated wrappers import the concrete parser and decoder entry files. Recipe and training dependencies remain outside those browser imports.
