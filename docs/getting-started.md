# Getting started

Train a small parser from examples, check it against independent evals, and import it into a browser application.

## Run the working examples

Use Bun 1.4.2 and Node 24. From your Matchbox checkout:

```sh
bun install
bun run train
bun run dev
```

Training uses native TensorFlow. The playground loads the exported models through TensorFlow.js CPU. Your input stays in the browser during inference.

Open the local URL printed by Vite. Try the filter demo, then visit `/training` to compare the two money pipelines and the parity training check.

## Create a task

After building the packages through `bun run train`, use the local CLI to scaffold a separate project:

```sh
bun packages/train/dist/cli.js init money --directory /tmp/my-matchbox-app
cd /tmp/my-matchbox-app
bun install
bunx matchbox train money
bunx matchbox dev money
```

The scaffold links to your local packages. Keep the Matchbox checkout available while using it.

## Understand what you own

```text
matchbox/money/
  parser.ts
  pipeline.ts
  data/train.jsonl
  evals/validation.jsonl
  evals/test.jsonl
.matchbox/money/
  model.matchbox
  model.ts
  model.d.matchbox.ts
  report.json
```

`parser.ts` defines valid output with Zod. `pipeline.ts` selects the learning strategy explicitly. Training examples teach behavior; validation and test examples check it independently. Generated files go in `.matchbox/` and stay out of Git.

The starter uses `fieldClassifier()`, which learns a finite set of values per field. A numeric output schema does not make it generalize to unseen amounts. Read [Training pipelines](pipelines.md) before choosing between direct value classification and a token model with an application-owned decoder.

## Import a trained model

In your Vite application's existing configuration, add the Matchbox plugin alongside your other plugins:

```ts
import { defineConfig } from "vite";
import { matchbox } from "@matchbox-ai/core/vite";

export default defineConfig({
  plugins: [matchbox()],
});
```

From a file at your application's root:

```ts
import money from "./.matchbox/money/model.matchbox";

const result = await money.parse("twenty dollars");

if (result.status === "ok") {
  console.log(result.value.amount, result.value.currency);
} else {
  console.log(result.reason);
}
```

Use TypeScript's `allowArbitraryExtensions` option with `moduleResolution: "bundler"` so the generated declaration supplies the output type. For bundlers without the plugin, import the generated `model.ts` wrapper instead.

The runtime loads lazily. Call `await money.load()` before going offline if you want to initialize ahead of the first parse. The [React hook](react.md) waits for initialization before reporting readiness.

## Decide whether it is ready to ship

Run `bunx matchbox eval money` and inspect the report. Keep test data independent from training data. Test unfamiliar inputs as well as familiar examples, and decide how your app should handle uncertainty.

Continue with [Evaluation](evaluation.md), [Project structure](project-structure.md), or the [CLI reference](cli.md).
