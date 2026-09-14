# Project configuration

Conventional tasks need `parser.ts` and `pipeline.ts`. Add `matchbox.config.ts` only to override paths or acceptance settings. The default export must satisfy `TrainingConfig` from `@matchbox-ai/train`.

```ts
import type { TrainingConfig } from "@matchbox-ai/train";
export default {
  train: "../../datasets/training.jsonl",
  validation: "../../datasets/validation.jsonl",
  eval: "../../datasets/test.jsonl",
} satisfies TrainingConfig;
```

Paths resolve relative to the config's directory, normally `matchbox/<task>/`. Task config overrides pipeline acceptance values, which override defaults.

| Field           | Type                                   | Default                                                                                      |
| --------------- | -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `formatVersion` | `1`                                    | `1`.                                                                                         |
| `task`          | String path.                           | `./parser.ts`.                                                                               |
| `train`         | String path.                           | `./data/train.jsonl`.                                                                        |
| `validation`    | String path.                           | `./evals/validation.jsonl`.                                                                  |
| `eval`          | String path.                           | `./evals/test.jsonl`.                                                                        |
| `output`        | Path ending in `.matchbox`.            | Project-level `.matchbox/<task>/model.matchbox`.                                             |
| `minAccuracy`   | Number from 0 to 1.                    | `0.95`, unless set in the pipeline.                                                          |
| `maxBytes`      | Positive number.                       | `64000`, unless set in the pipeline.                                                         |
| `baseline`      | Optional module path.                  | `./evals/baseline.ts` if present.                                                            |
| `challenges`    | Optional JSON path.                    | `./evals/challenges.json` if present.                                                        |
| `sequence`      | `{ recipe: string, decoder: string }`. | Derived from the token pipeline. This is a legacy configuration route; prefer `pipeline.ts`. |

Unknown properties are rejected. JSON configuration files are not supported. A baseline module default-exports a `MatchboxParser`; challenge JSON is an array of `{ input: string, output: null }` used by sequence reports.

## Project tooling

These APIs support CLI and build integrations. Import from `@matchbox-ai/train/project` in Node/Bun only.

| Function       | Arguments                       | Return value                                                                                                                                           |
| -------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `discover`     | `target?: string, cwd?: string` | Promise of an absolute task directory or config path. Walks ancestors from `cwd` (default `process.cwd()`). Multiple tasks require an explicit target. |
| `loadConfig`   | Task directory or config path.  | Promise of `{ config, root }` with defaults and overrides resolved.                                                                                    |
| `loadArtifact` | Task directory or config path.  | Promise of `{ artifact, task, decode, parser, inspect, output, config, root }`. Requires a previously trained artifact.                                |

`loadArtifact().inspect(input)` returns model diagnostics and the candidate, without representing a final validated answer. These details differ by strategy. Use `parser.parse(input)` for application behavior. Discovery, missing files, invalid config, and incompatible artifacts reject their promises.
