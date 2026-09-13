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
      evals/baseline.ts        # Optional.
      lib/                    # Optional application-owned helpers.
  .matchbox/money/
    model.matchbox
    model.ts
    model.d.matchbox.ts
    report.json
```

The CLI discovers these paths. Multiple tasks require an explicit name; it never silently chooses the first one. Commands can also target a project directory, task directory, or explicit matchbox.config.ts. A task-local config may override paths; ordinary examples need only parser.ts and pipeline.ts.

Generated artifacts are ignored. Validation gates packaging; test data does not select the model. Data generators live in the project-level scripts/ directory and write only matchbox/<task>/data/, preserving evals/ independently.
