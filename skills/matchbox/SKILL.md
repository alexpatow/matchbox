---
name: matchbox
description: Build, train, evaluate and integrate tiny browser-local models with Matchbox. Use for Matchbox tasks, pipelines, recipes, decoders, CLI workflows and uncertain predictions in TypeScript applications.
---

# Matchbox

Use the existing Matchbox APIs to complete the requested application task. Read contracts for the installed version before writing code; do not assume this skill and the installed packages have the same version.

## Find the right documentation

Inspect the application's package manager, framework and installed `@matchbox-ai/core`, `@matchbox-ai/train` and `matchbox-ai` versions. Prefer their bundled `docs/` directories under `node_modules`. If working in the framework repository, use root `docs/`. If packages are not installed, consult https://matchbox.alexpatow.com/llms.txt and explain which version you plan to use. Website docs follow main.

Read only the references needed for the request, relative to that documentation directory:

| Work                                        | Read                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------- |
| First task or project setup.                | `getting-started.md`, `project-structure.md`, `cli.md`.               |
| Choose a learning strategy.                 | `pipelines.md`, then the chosen strategy's contract.                  |
| Local token recognition and decoding.       | `reference/supervision.md`, `examples/money.md`.                      |
| Document-context span labeling.             | `primitives/recurrent-token-classifier.md`, `examples/lexer.md`.      |
| Training or export failure.                 | `training.md`, `reference/configuration.md`, `reference/training.md`. |
| Quality, coverage or uncertain predictions. | `evaluation.md`, `reference/evaluation.md`, `cli.md#inspect`.         |
| Browser and React integration.              | `reference/runtime.md`, `react.md`, `runtime-backends.md`.            |

Confirm names and overloads against installed exported declarations when needed. Do not import `@matchbox-ai/core/internal` in an application. If a capability is absent from the installed release, identify the limitation instead of inventing an API.

## Author the application task

Inspect existing parser, pipeline, recipe, decoder and evals before changing behavior. Preserve the application's framework configuration and scripts. Conventional entry points use `X.ts` or `X/X.ts`, never both. Helpers stay beside their owning module; shared domain code belongs in a named task folder. Generators belong in project-level `scripts/`.

The schema defines valid output; it does not choose a numeric representation or learning strategy. Make the consequential choice explicit:

- `fieldClassifier()` learns finite observed output values and discards word order. It cannot produce unseen numeric values.
- `tokenClassifier()` learns within a fixed window, using `SequenceRecipe` annotations and an application-owned decoder.
- `recurrentTokenClassifier()` learns document context using `RecurrentRecipe`, `textParts()`, `textFeatures()` and `spanLabels()`. Its output supervision is labeled spans. It predicts one label per part and does not accept a fixed-window annotation callback.

Choose among existing primitives based on the requested output and context. Propose any API addition separately. Keep conversions and semantic dictionaries explicit and application-owned; never insert one silently to make an eval pass. Burn owns neural-network loading and execution.

## Train and evaluate

Keep training, validation and test data independent. Fit learned preprocessing on training data only. Preserve held-out fixtures when regenerating data or fixing failures. Add independently authored negative cases and meaningful compositions.

Use `info` to inspect paths, `train` to fit and export, `eval` to score the saved artifact, and `inspect` to separate recognition from decoding. Consult `cli.md` for exact syntax. `init` only offers money and blank templates; a lexer requires authored modules and data. Avoid repeatedly training when the failure is a schema, path or annotation error.

Do not lower export gates merely to force success. Research exports with permissive gates must be explicitly requested and labeled. Record dataset identity, training time, model bytes, exact accuracy, abstention and relevant task metrics. Recurrent diagnostic agreement and partial candidate coverage do not mean complete-parser acceptance. Never tune settings on the test split or fabricate measurements.

## Integrate the evaluated artifact

Import the generated `.matchbox/<task>/model` module. Keep training/native dependencies out of browser code; Next.js inference belongs in a client component. Generated artifacts remain outside Git, so arrange training or restoration of the evaluated artifact before the app build.

`parse(input)` returns schema-validated output or uncertainty. Unfamiliar text is a model limitation, not inherently invalid user input. Confidence is uncalibrated; inspect failures before attributing them to a single cause.

Recurrent models can explicitly opt into `allowPartial: true` for interfaces that display uncertain source ranges. The candidate includes uncertain labels. `gpu: true` is a separate opt-in request, rejects when unavailable and does not silently fall back. `useMatchbox` preserves these options but warms CPU on mount. Read lifecycle details before promising GPU-only downloads.

Use the application's existing checks and verify real browser loading and inference. Report remaining limitations and what was measured. Publishing and deployment require the user's authorization; installing this skill provides none.
