# CLI

Run Matchbox inside an existing React, Next.js, or other JavaScript application. Your application keeps its own dev server and framework configuration. The command is provided by the matchbox-ai development dependency. Pipeline authoring and training APIs remain in @matchbox-ai/train. The CLI uses Commander for commands and Ink for interactive setup and status.

## Add a task

```sh
matchbox-ai init
matchbox-ai init money --template money
matchbox-ai init intent --template blank
```

Interactive setup offers the money example or a blank task. In scripts, specify `--template`. `--directory <path>` selects an existing application directory containing package.json. Matchbox preserves existing scripts, adds `matchbox:dev`, `matchbox:train`, and `matchbox:eval` if absent, and ignores `.matchbox/`. It refuses to replace an existing task directory. It installs dependencies automatically using the app’s package-manager declaration or lockfile, including workspace ancestors. With neither, it uses the invoking package manager, then Bun as a fallback. Use `--skip-install` to handle installation yourself. Installer logs go to stderr so `--json` stays machine-readable. If installation fails, the scaffold remains and the CLI prints the command to retry.

Package-manager build-script policies still apply. With pnpm, run `pnpm approve-builds` and select `@tensorflow/tfjs-node` before training.

The money template has an explicit token model, supervision, and decoder. The blank template has an editable label schema, an explicit word-feature classifier, and empty datasets. Write examples and independent evals before training it. Names do not select learning strategies.

## Open the workbench

```sh
matchbox-ai dev money
matchbox-ai dev money --port 4191 --no-open
```

The browser workbench runs on loopback, alongside your app. Try inputs, inspect recognition, save explicit corrections, train, evaluate, and measure browser inference. Source changes mark the model as stale. Training remains an explicit action. A successful training run reloads the model.

Predictions and timing run through TensorFlow.js CPU in the browser. Training and evaluation run in local child processes with fresh task modules. The speed measurement repeats the current input 100 times after 20 warmups; it excludes model loading and does not measure accuracy.

Saving validates output and rejects held-out inputs. It only changes training data. Token pipelines also need matching supervision from their authored recipe; the save result points to that file. Matchbox does not infer labels or normalization rules from a correction.

## Train and evaluate

```sh
matchbox-ai train money
matchbox-ai train money --verbose
matchbox-ai eval money
matchbox-ai eval money --json
```

Training validates datasets, fits the model, checks validation requirements, and exports a model plus a report. Failing validation stops export. The separate test set measures the selected model without influencing training. `eval` exits with status 1 if exact accuracy is below the configured threshold and includes expected/actual failures. `--verbose` reveals epoch loss. JSON output stays on stdout; diagnostics go to stderr.

## Inspect and script

```sh
matchbox-ai parse money "fifteen euros" --json
matchbox-ai inspect money "eleven grand" --json
matchbox-ai info money
matchbox-ai save money "twenty euros please" '{"amount":20,"currency":"EUR","approximate":false}'
```

A task argument can be a name, task directory, or config file. Omit the name when discovery finds exactly one task. Interactive `dev` offers a picker for multiple tasks; scripts require a name. `--config` selects an explicit path and cannot be combined with a task argument. Each command has its own `--help`.

Bare `matchbox-ai` shows available tasks and next actions. It does not create files. Use the one-shot commands for machine-readable results.
