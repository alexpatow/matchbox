# CLI reference

Install through `bunx matchbox-ai init` or run the installed `matchbox-ai` binary. Bun 1.4.2+ and Node.js 24+ are required for training.

## Commands

| Command               | Purpose                                                 |
| --------------------- | ------------------------------------------------------- |
| [`init`](#init)       | Add a task to an existing app and install dependencies. |
| [`dev`](#dev)         | Open the local browser workbench.                       |
| [`train`](#train)     | Train, validate, and package.                           |
| [`eval`](#eval)       | Evaluate the saved model against the test split.        |
| [`parse`](#parse)     | Return a prediction.                                    |
| [`inspect`](#inspect) | Show model recognition and the final result.            |
| [`info`](#info)       | Show resolved paths and strategy.                       |
| [`save`](#save)       | Add or replace a training example.                      |

## Common options

`-h, --help` works on every command. `-v, --version` prints the package version from the root command.

Every command except `init` accepts `[task]`, a task name, directory, or config path, and `-c, --config <path>` as an alternative. Do not combine a task argument with `--config`. Omitting the task works when discovery finds exactly one; interactive `dev` also offers a task picker.

Every command except `dev` accepts `--json`. JSON goes to stdout; diagnostics and installer output go to stderr. Bare `matchbox-ai` lists tasks and next actions without creating files.

## init

```sh
bunx matchbox-ai init [name] --template money
bunx matchbox-ai init intent --template blank --directory ./my-app
```

| Option               | Default                                              | Behavior                                                       |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| `[name]`             | `money` for the money template; `my-task` for blank. | Names the task directory. Pass a name to override the default. |
| `--template <name>`  | Interactive choice.                                  | `money` or `blank`; specify in scripts.                        |
| `--directory <path>` | Current directory.                                   | Existing application with a `package.json`.                    |
| `--skip-install`     | False.                                               | Write files without installing dependencies.                   |
| `--json`             | False.                                               | Print scaffold results as JSON.                                |

Adds `matchbox/<name>/`, ignores `.matchbox/`, and adds missing `matchbox:dev`, `matchbox:train`, and `matchbox:eval` scripts. Existing task directories are never overwritten. Framework config stays unchanged.

Installs core as an application dependency and train/CLI as development dependencies. Package-manager selection uses the app declaration or lockfile (including workspace ancestors), then the invoking package manager, then Bun. Failed installation preserves the scaffold and prints a retry command.

The blank template requires examples and evals before training. The money template includes token supervision and an application-owned decoder. No time template ships in 0.1.0; the time example is available in the repository.

## dev

```sh
bunx matchbox-ai dev [task] --port 4190 --no-open
```

`--port <number>` defaults to `4190`. The browser opens unless `--no-open` is set. The workbench listens on loopback and runs alongside your app's own dev server. It supports training, prediction, corrections, evaluation, and browser timing. Changes mark an artifact stale; training remains explicit.

Browser timing uses the current input, 20 warmups, and 100 measured predictions. It excludes loading and does not measure accuracy. `dev` has no JSON mode.

## train

```sh
bunx matchbox-ai train [task] --verbose --json
```

`--verbose` shows epoch loss outside JSON mode. Training validates datasets and token annotations, fits a model, gates on validation accuracy and size, and writes the artifact, TypeScript wrapper, declarations, and report.

Validation-gate failure stops export and exits nonzero. An independent test score below the threshold is reported after packaging; use `eval` to enforce the test threshold in CI.

## eval

```sh
bunx matchbox-ai eval [task] --json
```

Evaluates the saved artifact against the configured test file. Reports exact accuracy, acceptance, abstention, invalid outputs, and expected/actual failures. Exits `1` when exact accuracy is below `minAccuracy`. It does not retrain.

## parse

```sh
bunx matchbox-ai parse money 'twenty dollars' --json
```

Returns a [ParseResult](reference/runtime.md). Uncertainty is a prediction result and does not itself cause a nonzero exit. The CLI uses local inference, not a browser timing measurement.

## inspect

```sh
bunx matchbox-ai inspect money 'eleven grand' --json
```

Returns `{ input, ...diagnostics, result }`. Token models include labeled tokens and the decoded candidate; field models expose their strategy-specific diagnostics. `result` is the validated prediction. Diagnostics are for debugging and should not be treated as a stable application contract.

## info

```sh
bunx matchbox-ai info [task] --json
```

Returns resolved `config`, `authoring`, `pipeline`, `task`, `train`, `validation`, `eval`, and `output` paths. It does not require a trained artifact.

## save

```sh
bunx matchbox-ai save money 'twenty euros please' '{"amount":20,"currency":"EUR","approximate":false}' --json
```

Validates both values, then adds or replaces a matching input in training data. Matching ignores surrounding whitespace and case. Rejects held-out inputs and ambiguous duplicate training rows. Returns `{ saved, action, example, next }` where `action` is `added` or `updated`.

It does not retrain. Token pipelines also require updated recipe supervision before training. Corrections never modify validation or test data.

## Exit status

Successful commands exit `0`, including uncertain predictions. Invalid arguments, missing tasks/artifacts, malformed data, training failures, and failed eval thresholds exit nonzero. `--help` and `--version` exit `0`.
