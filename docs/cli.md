# Local development

Matchbox discovers authored files by their location, following Eve's separation of authored capability files, independent evals, and generated artifacts. See [Eve's project layout](https://github.com/vercel/eve/blob/main/docs/getting-started.mdx).

```text
my-parser/
  package.json
  parser/
    parser.ts
    data/
      train.jsonl
  evals/
    validation.jsonl
    evals.jsonl
  .matchbox/             # Generated and ignored by Git.
```

`parser/parser.ts` exports `defineParser(...)` with string input and a strict Zod output schema. JSONL rows contain `{ input, output }`. The default trainer learns primitive field values directly from these rows. It needs no aliases, token annotations, normalization rules, or architecture settings. A boolean field can use Zod's `.default(false)`; defaults are captured at definition time so validation agrees with artifact metadata.

Run the CLI from the project root or any descendant. It walks upward to find `matchbox.config.ts` or `parser/parser.ts`. Configuration is optional and overrides conventional paths, accuracy requirements, or model size budgets. An explicit config path remains supported for the existing filters and parity examples.

```bash
bun packages/train/dist/cli.js init /tmp/my-parser
cd /tmp/my-parser
bun install
bun run train
bun run dev
```

Build the workspace packages first with `bun run build:packages`. Packages are currently private and unpublished. The starter therefore uses local file dependencies pointing to the installed Matchbox packages, plus a Bun override for their workspace dependency. These paths are development scaffolding, not a portable published dependency setup.

Initialization shows a review before writing in a human terminal. An explicit target in a noninteractive invocation authorizes scaffolding that target. Existing files at generated paths are never overwritten. Installation is an explicit next step; no training or inference service is contacted.

## Commands

| Command                                                                     | Behavior                                                                                                            |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `matchbox` or `matchbox dev`                                                | Opens an interactive local session. In a directory without a project, it offers initialization.                     |
| `matchbox init <directory>`                                                 | Scaffolds the simple learned money example.                                                                         |
| `matchbox train`                                                            | Validates data, trains with native TensorFlow, gates export on validation, and packages weights and typed bindings. |
| `matchbox eval`                                                             | Evaluates the saved artifact with its recorded task and decoder. Training files are not required.                   |
| `matchbox parse 'text'`                                                     | Runs inference locally and prints the typed result or abstention reason.                                            |
| `matchbox inspect 'text'`                                                   | Shows per-field predictions for the simple model or token labels and the decoded candidate for a sequence pipeline. |
| `matchbox info`                                                             | Shows resolved task, dataset, output paths, and the selected authoring mode.                                        |
| `matchbox save 'text' '{"amount":15,"currency":"EUR","approximate":false}'` | Explicitly adds or updates a validated training example. It refuses inputs present in held-out splits.              |

Use `--config <path>` for an explicit config or project directory, `--json` for machine-readable results, `--verbose` for every training epoch, and `--help` for usage. Invalid arguments, malformed data, failed export gates, and eval accuracy below the configured threshold exit with code 1. Successful predictions and abstentions exit with code 0; inspect `status` for acceptance. Training imports are lazy, so help, inspection, and inference do not initialize TensorFlow.

In the interactive session, type text to parse it. `/train`, `/eval`, `/info`, and `/inspect [text]` expose the same commands. `/save <JSON>` explicitly saves a correction for the last input. Each command starts a fresh process so task/config changes and new artifacts are observed without stale module caches. Training is explicit, not triggered on every keystroke. `/exit` leaves the session. Scripted environments should use individual commands with `--json`.

## Explicit pipelines

Add both `parser/recipe.ts` and `parser/decode.ts` to opt into sequence supervision and application-owned decoding. A recipe chooses tokenization and supplies token labels; the decoder normalizes recognized tokens into the task output. Put supporting functions in `parser/lib/`. They are ordinary TypeScript imports, not automatically executed plugins. `evals/baseline.ts` and `evals/challenges.json` are discovered when present.

The framework supplies no money dictionary. The explicit money pipeline owns its number-word table and multiplier rules. Adding handwritten examples there can require additional supervision in its recipe. The default structured-value trainer has no such adapter.

See [the two money examples](../examples/README.md) for the measured capabilities and limitations.
