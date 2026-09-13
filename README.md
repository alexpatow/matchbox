# Matchbox

**Compile examples into tiny models for the browser.**

Matchbox trains small, task-specific models for fuzzy inputs and strict structured outputs. Its aim is regex++: learned recognition where application heuristics become brittle, followed by ordinary validation and application-owned normalization where needed.

Developers author a parser contract, an explicit training pipeline, examples, and independent evals. Matchbox trains through native TensorFlow, evaluates, packages weights, and exposes a typed browser-local parse API. The current examples demonstrate controlled tasks; they do not establish broad language understanding.

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
import { definePipeline, wordTokens, fieldClassifier } from "@matchbox-ai/train";
export default definePipeline({
  input: wordTokens(),
  prediction: fieldClassifier(),
});
```

This explicit preset classifies field values seen in training. It cannot construct unseen amounts. The [pipeline example](examples/money-pipeline/README.md) demonstrates application-owned token supervision and normalization. Matchbox does not infer numeric encodings or add domain rules from a Zod schema.

```sh
matchbox train money
matchbox eval money
matchbox dev money
```

Configure the Vite plugin, then import .matchbox/money/model.matchbox and call await parser.parse(input). React integration lives at @matchbox-ai/core/react. The runtime loads serialized TensorFlow models and returns validated outputs or uncertainty.

## Repository

packages/core contains the browser-facing framework and packages/train contains the toolchain. Self-contained examples live under examples/. apps/playground hosts the React demo; apps/benchmarks measures browser inference.

Read the [docs index](docs/README.md), [project conventions](docs/project-structure.md), [primitives](docs/primitives/README.md), and [example comparison](examples/README.md). Public docs ship with both packages for coding agents. The [Matchbox skill](skills/matchbox/SKILL.md) describes the development workflow. [Third-party notices](THIRD-PARTY-NOTICES.md) preserve source attribution.

Run bun run check and bun run test:browser before proposing a PR. Generated artifacts remain ignored. Tiny models should earn their place through independent evaluations, honest performance measurements, and a useful complexity tradeoff against deterministic baselines.
