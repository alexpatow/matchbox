# @matchbox-ai/train

The Bun-based training package owns the `matchbox` executable and `TrainingConfig` types. Native TensorFlow is loaded only for training; inference and browser imports remain portable JavaScript.

```bash
matchbox init my-parser
cd my-parser
bun install
bun run train
bun run dev
```

The current private workspace scaffold uses local file dependencies. Build the packages before invoking `packages/train/dist/cli.js`. Published registry installation is not available yet.

The CLI discovers `parser/parser.ts`, `parser/data/train.jsonl`, and separate `evals/validation.jsonl` and `evals/evals.jsonl` fixtures. Generated weights, reports, and typed wrappers go under `.matchbox/`. A root `matchbox.config.ts` is optional.

The default trainer learns structured primitive field values directly from examples. Adding both `parser/recipe.ts` and `parser/decode.ts` opts into an explicit sequence pipeline. Both use native `@tensorflow/tfjs-node`, held-out evaluation, int8 export, and deterministic schema validation. See [the CLI guide](../../docs/cli.md) and [examples](../../examples/README.md).

Commands include `init`, `dev`, `train`, `eval`, `parse`, `inspect`, `info`, and explicit `save`. Use `--help`, `--json`, and `--config <path>` for scripting. The interactive session exposes `/train`, `/eval`, `/inspect`, `/info`, `/save`, and `/exit`.
