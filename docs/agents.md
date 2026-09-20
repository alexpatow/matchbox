# Use Matchbox with a coding agent

Install the Matchbox skill in the application where your agent will work:

```sh
npx skills add alexpatow/matchbox --skill matchbox
```

This uses Vercel's [skills CLI](https://github.com/vercel-labs/skills). Select your agent when prompted. Installing the skill adds instructions; it does not install Matchbox, create a task or train a model. Review the [skill source](https://github.com/alexpatow/matchbox/blob/main/skills/matchbox/SKILL.md) before installing it.

## Give the agent a task contract

Start with the input, the output you need and examples of correct behavior. Describe what should happen when the model is uncertain. For example:

> Add a Matchbox parser to this React app that labels source-code spans as plain, comment or string. Use the installed version's documentation. Show the pipeline choice and its limitations before training. Keep training, validation and test data separate. Display partial highlights with uncertain ranges, and record training time, test quality, model bytes and browser timing.

For an existing task, point the agent at `matchbox/<task>/`, its evals and any observed failure. Ask it to inspect recognition and decoding separately before changing either.

## Read docs for the installed version

All three packages include the public documentation:

```text
node_modules/@matchbox-ai/core/docs/
node_modules/@matchbox-ai/train/docs/
node_modules/matchbox-ai/docs/
```

Read `package.json` in each installed package to check versions. The runtime, trainer and CLI should use the same release. The website and repository follow current development and may describe APIs newer than your installed version.

The packages also include the skill at `skills/matchbox/SKILL.md`. To install that version-matched copy with the skills CLI, use a local source:

```sh
npx skills add ./node_modules/@matchbox-ai/core --skill matchbox
```

The standalone `docs/agent-skill.md` remains available for agents that accept a file as context. Older releases may include only that copy. Skill installation and activation depend on the agent; mention Matchbox explicitly and confirm the agent has read the skill and relevant docs.

## Read the website as Markdown

Every documentation page is available with `.md` appended, for example [getting-started.md](/docs/getting-started.md). The [llms.txt index](/llms.txt) lists the Markdown pages, and the [skill file](/skills/matchbox/SKILL.md) is directly readable. These files are generated from the same sources as the website.

An agent can read only what its current task needs:

| Task                                  | Start with                                                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Add a task to an existing app.        | [Getting started](getting-started.md), [project structure](project-structure.md).                     |
| Choose a model strategy.              | [Pipelines](pipelines.md).                                                                            |
| Label spans across a document.        | [Recurrent classifier](primitives/recurrent-token-classifier.md), [lexer example](examples/lexer.md). |
| Train or investigate a failed export. | [Training](training.md), [CLI](cli.md), [supervision](reference/supervision.md).                      |
| Evaluate quality and uncertainty.     | [Evaluation](evaluation.md).                                                                          |
| Load a model in React or Next.js.     | [Runtime](reference/runtime.md), [React](react.md).                                                   |

## Review the result

Ask the agent to identify what the model learned and what the decoder implements. Require held-out results, including abstention and false acceptance, before treating a model as useful. A successful build or valid output schema does not establish accuracy.

The skill directs agents to existing primitives. It does not authorize API redesign, hidden semantic dictionaries, test-set tuning, publishing or deployment.
