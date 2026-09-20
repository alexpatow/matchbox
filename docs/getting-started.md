# Getting started

Add the money parser to an existing JavaScript app. You need a `package.json`, Bun 1.4.2+ and Node.js 24+. Training runs locally and needs no API key.

## Add a task

From your application root:

```sh
bunx matchbox-ai init money --template money
```

This installs dependencies with your app's package manager and creates `matchbox/money/` with a parser, pipeline, supervision, decoder and datasets. It preserves your framework configuration. See [project structure](project-structure.md) for the files.

`npx matchbox-ai` and `pnpm dlx matchbox-ai` also launch the CLI; training still requires Bun.

## Train and evaluate

```sh
bunx matchbox-ai train money
bunx matchbox-ai parse money '$15' --json
bunx matchbox-ai eval money
```

A successful parse has `status: "ok"` and this `value`:

```json
{ "amount": 15, "currency": "USD", "approximate": false }
```

For an interactive browser workbench, run `bunx matchbox-ai dev money`. It runs separately from your app at `http://localhost:4190`.

## Import the model

Training writes the model and a typed wrapper to `.matchbox/money/`. From a file at your app root:

```ts
import money from "./.matchbox/money/model";

const result = await money.parse("twenty dollars");
if (result.status === "ok") {
  console.log(result.value.amount);
} else {
  console.log(result.reason);
}
```

Adjust the import for your file's location. No bundler plugin is needed. In Next.js, use a client component. [React integration](react.md) covers loading state.

## Adapt the task

For this template, update both `data/train.jsonl` and its token annotations in `data/train-spans.json`, then retrain and evaluate. Keep validation and test data separate. The model recognizes spans; the [money decoder](examples/money.md) converts numbers and applies arithmetic.

For a new task:

```sh
bunx matchbox-ai init intent --template blank
```

The blank template starts with a finite field classifier and empty datasets. Define the schema and supply examples before training. [Choose a pipeline](pipelines.md) if you need numeric or compositional output.

## Build your app

Generated artifacts are ignored by Git. Train before building, or restore an evaluated artifact with its matching parser and decoder:

```sh
bunx matchbox-ai train money
npm run build
```
