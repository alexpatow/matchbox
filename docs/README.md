# Matchbox documentation

Start with [Getting started](getting-started.md) to add a task, train a model, and import it into an existing app.

- [CLI reference](cli.md) covers every command and option.
- [API reference](reference/README.md) indexes the public contracts by package.
- [Training](training.md) walks through fitting and exporting a model.
- [Training pipelines](pipelines.md) explains the two learning strategies and their limits.
- [Project structure](project-structure.md) maps authored files and generated artifacts.
- [Evaluation](evaluation.md) explains validation gates, test data, and uncertainty.
- [Money](examples/money.md) and [time](examples/time.md) show token recognition with explicit application-owned decoding.

Matchbox currently accepts string inputs. Core owns validation and browser integration; train owns build-time orchestration; TensorFlow owns training and execution.
