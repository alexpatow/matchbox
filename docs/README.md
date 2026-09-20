# Build a model that runs in your app

Matchbox trains small task-specific models from examples and runs them locally in the browser. You define the output contract, choose an explicit learning strategy, provide examples and evals, then import the generated TypeScript module.

## Start with a working example

[Getting started](getting-started.md) adds a money parser to an existing React, Next.js or other JavaScript app. It walks through installation, training, evaluation and the first call to `parse`.

If you work with a coding agent, [install the Matchbox skill](agents.md). It directs the agent to version-matched documentation and existing APIs.

## Choose the next step

| You want to…                             | Read                                                    |
| ---------------------------------------- | ------------------------------------------------------- |
| Decide whether a model fits the problem. | [Choose a pipeline](pipelines.md).                      |
| Understand which files you author.       | [Project structure](project-structure.md).              |
| Supply examples and held-out answers.    | [Datasets](dataset-format.md).                          |
| Fit and package a model.                 | [Training](training.md).                                |
| Find out whether it is good enough.      | [Evaluation](evaluation.md).                            |
| Load it in a web application.            | [Runtime](reference/runtime.md) and [React](react.md).  |
| Look up a command or type.               | [CLI](cli.md) and [API reference](reference/README.md). |

## Learn from the examples

- [Money](examples/money.md) separates learned span recognition from explicit number conversion.
- [Date, time and duration](examples/time.md) returns structures that the application resolves against its clock and timezone.
- [Syntax highlighting](examples/lexer.md) uses document context and partial results with uncertain ranges.

Models can abstain. A valid output schema guarantees shape, not correctness. Keep independent evals, inspect failures, and measure inference on the devices you support.

Inputs currently must be strings. Matchbox provides task contracts, training workflows, packaging and validation; Burn trains and executes the models. General text generation, automatic architecture search and hosted inference are outside the current API.
