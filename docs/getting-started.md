# Getting started

Matchbox is a TypeScript framework for building small models that run in the browser. Start with the money example inside your existing application, train it locally, and import the result.

The CLI requires Bun 1.4.2 or newer and Node 24 or newer for the local training toolchain.

## Add Matchbox to your app

Once the first release is published, run this inside your existing React or Next.js app:

```sh
bunx matchbox-ai init money --template money
bunx matchbox-ai dev money
```

The CLI installs `@matchbox-ai/core` as an application dependency and `@matchbox-ai/train` and `matchbox-ai` as development dependencies, using your package manager. It preserves existing scripts and framework configuration. Run your app's dev server separately. Use `--skip-install` to defer installation.

When developing Matchbox itself, run `bun install` and `bun run build:packages` in this repository. Run `bun run matchbox init money --template money --directory /path/to/app --skip-install` to inspect a scaffold before the packages are published. It writes registry versions; it does not vendor a copy of the checkout.

## Train in the workbench

Choose **Train model**. Once training finishes, try `$15` or `around twenty six grand in euros`. Predictions run in your browser. Choose **Evaluate** to check independent test examples, or **Measure browser speed** to time the current input.

The same operations are available in the terminal:

```sh
bunx matchbox-ai train money
bunx matchbox-ai eval money
```

## Understand the authored task

```text
matchbox/money/
  parser.ts
  pipeline.ts
  lib/recipe.ts
  lib/decode.ts
  data/train.jsonl
  data/train-spans.json
  evals/validation.jsonl
  evals/test.jsonl
.matchbox/money/
  model.matchbox
  model.ts
  report.json
```

The parser defines valid output. The pipeline explicitly selects a token model. The recipe supplies supervised token labels; the decoder normalizes recognized spans. New training examples may need new token annotations. Read the generated task README before extending it.

Use `matchbox-ai init my-task --template blank` to author another task. The blank starter explicitly uses word features and finite field classification; replace that pipeline if it does not suit your task. Schemas do not automatically select numeric encodings or transformations.

## Import into React or Next.js

The generated TypeScript wrapper needs no bundler plugin. This example assumes a component at your application root; adjust the relative path for your component's location. In Next.js, use a client component:

```tsx
"use client";

import { useMatchbox } from "@matchbox-ai/core/react";

const loadMoney = () => import("./.matchbox/money/model");

export function MoneyButton() {
  const { parse, status } = useMatchbox(loadMoney);

  return (
    <button
      disabled={status !== "ready"}
      onClick={async () => {
        const result = await parse("twenty dollars");
        if (result.status === "ok") console.log(result.value.amount);
        else console.log(result.reason);
      }}
    >
      Parse an amount
    </button>
  );
}
```

Train before your application build. Generated artifacts remain ignored, so CI needs to train or restore a previously evaluated artifact. Import training helpers only in the authored pipeline and training scripts, never in client components. For `.matchbox` imports with Vite, the optional [Vite integration](react.md) remains available.

## Run the repository showcase

From the Matchbox checkout, `bun run dev` trains the examples and starts the showcase. The home page demonstrates customer filtering; `/training` demonstrates money parsing and the parity training check.

Continue with [CLI](cli.md), [Evaluation](evaluation.md), [Training pipelines](pipelines.md), or [Project structure](project-structure.md).
