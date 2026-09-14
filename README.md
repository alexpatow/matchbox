# Matchbox

**Build small models that run in the browser.**

Matchbox is a TypeScript framework for building small, task-specific models and shipping them inside web applications. Define a task, train from examples, evaluate it, and run the model locally in the browser.

Small models could predict what to prefetch, prioritize speculative work, classify content, or turn natural language into structured data. Replacing brittle parsing rules is one use case. The current authoring API focuses on parsers, with working filter, money, and parity examples.

For these examples, developers author a parser contract, an explicit training pipeline, examples, and independent evals. Matchbox trains through native TensorFlow, evaluates, packages weights, and exposes a typed browser-local parse API. The current examples demonstrate controlled tasks; they do not establish broad language understanding.

## Start locally

Use Bun 1.4.2 and Node 24.

```sh
bun install --frozen-lockfile
bun run dev
```

The React playground runs at http://127.0.0.1:5173. Open /training for the money and parity examples. Packages are private and unpublished; [getting started](docs/getting-started.md) explains local scaffolding.

```text
matchbox/money/
  parser.ts
  pipeline.ts
  data/train.jsonl
  evals/validation.jsonl
  evals/test.jsonl
```

```ts
import { definePipeline, tokenClassifier } from "@matchbox-ai/train";
export default definePipeline({
  prediction: tokenClassifier({ recipe: "./lib/recipe.ts", decode: "./lib/decode.ts" }),
});
```

The [money example](examples/money/README.md) demonstrates learned token recognition, explicit supervision, and application-owned normalization. The CLI adds this task to an existing React or Next.js application without replacing its scripts or framework configuration.

```sh
matchbox train money
matchbox eval money
matchbox dev money
```

Import the generated .matchbox/money/model.ts wrapper and call await parser.parse(input). React integration lives at @matchbox-ai/core/react. The runtime loads serialized TensorFlow models and returns validated outputs or uncertainty.

## Repository

packages/core contains the browser-facing framework and packages/train contains the toolchain. Self-contained examples live under examples/. apps/playground hosts the React demo; apps/benchmarks measures browser inference.

Read the [docs index](docs/README.md), [project conventions](docs/project-structure.md), [primitives](docs/primitives/README.md), and [example comparison](examples/README.md). Public docs ship with both packages for coding agents. The [Matchbox skill](skills/matchbox/SKILL.md) describes the development workflow. [Third-party notices](THIRD-PARTY-NOTICES.md) preserve source attribution.

Run bun run check and bun run test:browser before proposing a PR. Generated artifacts remain ignored. Tiny models should earn their place through independent evaluations, honest performance measurements, and a useful complexity tradeoff against deterministic baselines.
