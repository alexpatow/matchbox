# Project configuration

Conventional tasks need parser and pipeline entry points, each authored as `X.ts` or `X/X.ts`. Add `matchbox.config.ts` only to override paths or acceptance settings. The default export must satisfy `TrainingConfig` from `@matchbox-ai/train`.

```ts
import type { TrainingConfig } from "@matchbox-ai/train";
export default {
  train: "../../datasets/training.jsonl",
  validation: "../../datasets/validation.jsonl",
  eval: "../../datasets/test.jsonl",
} satisfies TrainingConfig;
```

Paths resolve relative to the config's directory, normally `matchbox/<task>/`. Task config overrides pipeline acceptance values, which override defaults.

| Field         | Type                                                           | Default                                                                                      |
| ------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `task`        | String path.                                                   | `parser.ts` or `parser/parser.ts`.                                                           |
| `train`       | String path.                                                   | `./data/train.jsonl`.                                                                        |
| `validation`  | String path.                                                   | `./evals/validation.jsonl`.                                                                  |
| `eval`        | String path.                                                   | `./evals/test.jsonl`.                                                                        |
| `output`      | Path ending in `.matchbox`.                                    | Project-level `.matchbox/<task>/model.matchbox`.                                             |
| `minAccuracy` | Number from 0 to 1.                                            | `0.95`, unless set in the pipeline.                                                          |
| `maxBytes`    | Positive number.                                               | `256000` for recurrent models, otherwise `64000`, unless overridden.                         |
| `challenges`  | Optional JSON path.                                            | `./evals/challenges.json` if present.                                                        |
| `sequence`    | `{ recipe: string, decoder: string, contextRadius?: number }`. | Derived from the token pipeline. This is a legacy configuration route; prefer `pipeline.ts`. |

Unknown properties are rejected. JSON configuration files are not supported. Challenge JSON is an array of `{ input: string, output: null }` used by sequence reports.

## Project tooling

These APIs support CLI and build integrations. Import from `@matchbox-ai/train/project` in Node/Bun only.

| Function       | Arguments                       | Return value                                                                                                                                           |
| -------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `discover`     | `target?: string, cwd?: string` | Promise of an absolute task directory or config path. Walks ancestors from `cwd` (default `process.cwd()`). Multiple tasks require an explicit target. |
| `listTasks`    | Application root directory.     | Promise of sorted task names immediately under `matchbox/`, recognizing both parser entry forms.                                                       |
| `loadConfig`   | Task directory or config path.  | Promise of `{ config, root, pipelinePath }` with defaults and overrides resolved.                                                                      |
| `loadArtifact` | Task directory or config path.  | Promise of `{ artifact, task, decode, parser, inspect, output, config, root }`. Requires a previously trained artifact.                                |

`loadArtifact().inspect(input)` returns model diagnostics and the candidate, without representing a final validated answer. These details differ by strategy. Use `parser.parse(input)` for application behavior. Discovery, missing files, invalid config, and incompatible artifacts reject their promises.

`loadConfig` resolves task, recipe, and decoder module paths to absolute filenames. An extensionless override such as `task: "./schema"` resolves `schema.ts` or `schema/schema.ts`. An explicit filename bypasses conventional lookup for that module. Both conventional forms existing produces an error.

Recurrent pipelines resolve `sequence.recurrent` with `epochs`, `learningRate`, `batchParts`, `maxInputLength` and `maxParts`. Prefer authoring these through `recurrentTokenClassifier` in `pipeline.ts`; see the [option contracts](../primitives/recurrent-token-classifier.md#train-and-evaluate).

Numeric pipelines resolve `features: { encoder: string, threshold: number }` from `featureClassifier`. The encoder path follows the same module resolution rules. Numeric and sequence strategies cannot be combined.
