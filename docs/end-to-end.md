# The first examples-to-browser flow

Matchbox now has a working, deliberately constrained filter proof. It learns clause recognition from examples, compiles boolean structure deterministically, validates the result against the application's task, and runs in the browser.

## Run it

```sh
bun install --frozen-lockfile
bun run train
bun run eval
bun run dev
```

Open `http://127.0.0.1:5173`. Try `active customers and Swedish customers and ARR over 50k`. The table should show Northstar Studio. The example uses fictional customers. The model runs locally after its static JavaScript chunk loads.

`bun run check` trains, typechecks, tests, and builds the production app. `bun run test:browser` verifies offline inference and records browser timing under `test-results/`. `bun run research` produces the separate challenge report. The test suite verifies that changing held-out labels cannot change the selected artifact.

The commands work in this private workspace. Matchbox is not published to npm yet. The built core package also contains the Bun-based `matchbox` executable. The long-form workspace command is:

```sh
bun run matchbox train examples/filters/matchbox.config.ts
bun run matchbox eval examples/filters/matchbox.config.ts
```

## Authoring

The filter example has a small conventional layout:

```text
examples/filters/
  matchbox.config.ts
  data/train.jsonl
  data/validation.jsonl
  data/evals.jsonl
  data/challenges.json
  src/filter/task.ts
  src/filter/baseline.ts
  src/generated/filters.matchbox
  src/generated/filters.d.matchbox.ts
  src/generated/filters.ts
  src/generated/filters.matchbox.report.json
```

The application owns its fields, value types, strict Zod schema, and deterministic table predicate. The configuration points at those files and sets validation accuracy and artifact size requirements. Training examples currently contain single predicates. Validation and evaluation can contain composed ASTs. Unsupported training output shapes fail clearly rather than silently training the wrong task.

The trainer also emits `centroid.matchbox` and `linear.matchbox` comparison artifacts for the browser benchmark. They are dynamically imported only when the benchmark is requested.

Generated files stay out of Git and are recreated by the root build scripts. Retrain after changing datasets or the task. The dev server watches generated imports, but it does not retrain on every dataset edit. A changed task schema fails artifact initialization with a retraining message.

## The import API

Add one Vite plugin:

```ts
import { matchbox } from "@matchbox-ai/core/vite";

export default { plugins: [matchbox()] };
```

Enable `allowArbitraryExtensions` in the application's TypeScript configuration. Training writes a declaration beside each artifact, so imports retain the exact application's output type rather than falling back to `unknown`.

```ts
import filters from "./generated/filters.matchbox";

const result = await filters.parse("Swedish customers and ARR over 50k");
if (result.status === "ok") {
  console.log(result.value);
}
```

The artifact is versioned JSON containing int8-quantized weights, feature vocabulary, predicate templates, training-derived field tokens, task metadata, and a relative task-module path. It is not a custom programming language. The Vite load hook converts it to an ESM module which initializes the runtime against the task. The task remains a build dependency and must travel with the generated artifact. The generated `.ts` wrapper provides the same typed API for bundlers without the plugin.

A static import includes the model in the importing module's dependency graph. A dynamic import loads it lazily. Vite hashes the emitted chunk for updates; ESM caches the module and initialized model. There is no persistent offline cache or service worker yet.

```tsx
import { useMatchbox } from "@matchbox-ai/core/react";

const loadFilters = () => import("./generated/filters.matchbox");

function Search() {
  const parser = useMatchbox(loadFilters);
  // parser.status is loading, ready, or error.
  // parser.parse(input) returns the typed result asynchronously.
  return <input onChange={async (event) => console.log(await parser.parse(event.target.value))} />;
}
```

Keep the loader outside the component. Imports are SSR-safe, while the hook loads after mounting. The demo discards stale parse completions when a newer query arrives. Its empty or uncertain state shows all customers and explicitly says no filter was applied.

## Supported behavior and boundaries

The example recognizes active, inactive, and churned status; exclusion of churned customers; Sweden, Germany, America, and Norway; and ARR comparisons. Nonnegative numeric amounts can use decimal points, comma thousands separators, and `k` or `m` suffixes. Currency symbols are syntactic prefixes, with amounts interpreted in the application's unit; no currency conversion occurs.

The AST is a predicate, an AND of predicates, or an OR of predicates/AND groups. AND binds more tightly than OR. Limits are eight clauses, 500 input characters, and bounded schema arrays. Exclusion uses `neq`; there is no general recursive NOT expression or executable query output.

Explicit `and` and `or` joins work. Training-derived field tokens reject detected mixed-field clauses that would otherwise lose constraints. This is not a guarantee of semantic completeness. Implicit joins, dates, ownership, ranges, parentheses, arbitrary nesting, general negation, and unseen semantic classes remain research work. The challenge report makes those limitations visible.

The confidence value is a heuristic using score separation and vocabulary coverage. It is not calibrated. Unknown inputs can still be misclassified, so the example is a preview UI. Schema validity guarantees structure and allowed values, not that an interpretation matches the user's intent.

## Training and evaluation

The trainer fits its vocabulary and field tokens on training data only. It compares nearest-centroid classification and full-batch softmax regression over normalized word and bigram features. Both are quantized before evaluation. The compiler and numeric normalizer are shared across candidates. No teacher, remote service, or separate Python environment is used.

The smallest candidate meeting validation accuracy and artifact size thresholds is packaged. The held-out eval set is scored after selection. Reports include exact structural match, invalid-output rate, abstention, confidence bins, per-example failures, dataset hashes, and an artifact hash. Object key order does not affect exact match; array order and boolean structure do.

CLI evaluation currently uses the full project configuration, including its training and validation files. No candidate is packaged when requirements fail; an existing artifact remains untouched and the command exits nonzero. Build scripts stop on that failure. Artifact size is measured as serialized bytes, including metadata, and excludes the JavaScript runtime, Zod, and the application.

## Inspiration

[Eve's file-based authoring](https://github.com/vercel/eve) informed the small conventional project layout. [vGPU's shader imports](https://github.com/vercel-labs/vgpu/blob/main/packages/wgsl/README.md) informed the custom-extension load hook and generated type boundary. Its [public API and size discipline](https://github.com/vercel-labs/vgpu) informed separate runtime/tooling entry points and explicit budgets. These are design references, not dependencies or copied source.

Plain JavaScript is the first backend. WASM and WebGPU need a measured advantage before they justify extra startup and packaging work. The runtime exposes no tensors, tokenizer setup, or GPU configuration to consumers.
