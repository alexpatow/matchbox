# Getting started

Train the included money parser, try it locally, and call it from your app. You need an existing JavaScript project with a `package.json`, Bun 1.4.2+, and Node.js 24+ for native TensorFlow training. No API key is required.

## 1. Add a task

Run from your application's root:

```sh
bunx matchbox-ai init money --template money
```

You can also launch the CLI with `npx matchbox-ai` or `pnpm dlx matchbox-ai`. Bun is still required by the training toolchain. Initialization installs dependencies using your app's package manager and adds these files:

```text
matchbox/money/
  parser.ts                # Valid input and output.
  pipeline.ts              # Explicit learning strategy.
  lib/recipe.ts            # Training token labels.
  lib/decode.ts            # Convert recognized spans to output.
  data/train.jsonl
  data/train-spans.json
  evals/validation.jsonl    # Gate model export.
  evals/test.jsonl          # Measure the selected model.
```

Your framework config and dev server stay as they are. With pnpm, approve `@tensorflow/tfjs-node` using `pnpm approve-builds` before training.

## 2. Train and try it

```sh
bunx matchbox-ai train money
bunx matchbox-ai parse money '$15' --json
bunx matchbox-ai eval money
```

Training writes `.matchbox/money/model.ts`, `model.matchbox`, and `report.json`. On a successful parse, `result.value` contains:

```json
{ "amount": 15, "currency": "USD", "approximate": false }
```

The full result also includes `status` and an uncalibrated `confidence` score.

For a browser workbench, run `bunx matchbox-ai dev money`. It opens at `http://localhost:4190`. Try inputs, inspect recognized tokens, and measure inference on your device. Training runs locally; predictions run in the browser.

## 3. Use it in your app

The generated TypeScript module works without a bundler plugin. From a file in your application root:

```ts
import money from "./.matchbox/money/model";

const result = await money.parse("twenty dollars");
if (result.status === "ok") {
  console.log(result.value.amount); // Typed as number.
} else {
  console.log(result.reason); // Ask for clarification or use a fallback.
}
```

Adjust the relative import for your file's location. In Next.js, import the model from a client component. See [React integration](react.md) for loading state and `useMatchbox`.

## 4. Change the behavior

Add input/output rows to `data/train.jsonl`. In this token-based example, add corresponding token labels to `data/train-spans.json`. Run `train` again, then `eval`. Keep validation and test examples separate from training.

The model learns which spans represent an amount, currency, or multiplier. `lib/decode.ts` does the arithmetic. Read [the money example](examples/money.md) before extending its supported number formats.

To start your own task:

```sh
bunx matchbox-ai init intent --template blank
```

The blank template uses a finite field classifier and empty datasets. Define your labels, add training and independent eval examples, then train. [Choose a pipeline](pipelines.md) before using it for numeric or compositional output.

## 5. Build and deploy

Generated models are ignored by Git. Train before your app build, for example `bunx matchbox-ai train money && npm run build`, or restore a previously evaluated artifact together with its matching schema and decoder.

Continue with [Training](training.md), [Evaluating](evaluation.md), [CLI commands](cli.md), [API reference](reference/README.md), or [project configuration](reference/configuration.md).
