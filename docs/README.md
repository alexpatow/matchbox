# Matchbox documentation

Train small models from examples, then import them into your browser app. Inputs and outputs follow your Zod schemas. Text classifiers accept strings; numeric feature classifiers also support structured input.

[Get started](getting-started.md) with the money parser, or [install the coding-agent skill](agents.md).

| Task                              | Guide                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------- |
| Choose how the model learns.      | [Pipelines](pipelines.md).                                                   |
| Organize a task and its examples. | [Project structure](project-structure.md) and [datasets](dataset-format.md). |
| Train and package a model.        | [Training](training.md).                                                     |
| Check quality and uncertainty.    | [Evaluation](evaluation.md).                                                 |
| Run it in your app.               | [Runtime](reference/runtime.md) and [React](react.md).                       |
| Look up a command or type.        | [CLI](cli.md) and [API reference](reference/README.md).                      |

The [money](examples/money.md), [time](examples/time.md) [lexer](examples/lexer.md), and [sketch](examples/sketch.md) examples show different learning and decoding choices. Try them on the [examples page](/examples).
