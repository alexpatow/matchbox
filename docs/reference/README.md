# API reference

The examples use these public exports. Each page lists imports, arguments, return values, and failure behavior.

| Package                      | Export                                                                           | Reference                                           |
| ---------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------- |
| `@matchbox-ai/core`          | `defineParser`, parser and validation types                                      | [Task definition](../parser-api.md)                 |
| `@matchbox-ai/core`          | `parseDatasets`, dataset types                                                   | [Datasets](../dataset-format.md)                    |
| `@matchbox-ai/core/runtime`  | `createParser`, `MatchboxParser`, `ParseResult`                                  | [Runtime](runtime.md)                               |
| `@matchbox-ai/core/runtime`  | `Token`, `TaggedToken`, `SequenceDecoder`                                        | [Token supervision](supervision.md)                 |
| `@matchbox-ai/core/runtime`  | `compileClauses`, `Predicate`, `FilterExpression`                                | [Filter compilation](runtime.md#compileclauses)     |
| `@matchbox-ai/core/react`    | `useMatchbox`                                                                    | [React](../react.md)                                |
| `@matchbox-ai/core/vite`     | `matchbox`                                                                       | [Vite](vite.md)                                     |
| `@matchbox-ai/train`         | `definePipeline`, `Pipeline`, `wordTokens`, `fieldClassifier`, `tokenClassifier` | [Pipeline API](pipeline.md)                         |
| `@matchbox-ai/train`         | `SequenceRecipe`, `OutputDecoder`, `tokenize`                                    | [Token supervision](supervision.md)                 |
| `@matchbox-ai/train`         | `train`, `TrainingConfig`                                                        | [Training API](training.md)                         |
| `@matchbox-ai/train`         | `evaluate`                                                                       | [Evaluation API](evaluation.md)                     |
| `@matchbox-ai/train/project` | `discover`, `loadConfig`, `loadArtifact`                                         | [Project tooling](configuration.md#project-tooling) |
| `matchbox-ai`                | Eight CLI commands                                                               | [CLI reference](../cli.md)                          |

`@matchbox-ai/core/internal` is for coordinated framework packages and research tests. Application code should use the entry points above.

`version` is exported from `@matchbox-ai/core` and contains the installed core package version.

Inputs are currently strings. Support for structured features requires a separate input and encoder contract.
