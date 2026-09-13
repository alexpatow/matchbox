# Matchbox

**Compile examples into tiny models for the browser.**

Matchbox is a framework for training tiny, task-specific models from examples and packaging them as ordinary TypeScript dependencies that run directly inside web applications.

The idea is **regex++**: use small learned models where fuzzy or contextual input makes pattern matching brittle, but the output is small, rigid, and machine-readable.

**Status:** Working filter, parity, and money examples connect training, evaluation, generated `.matchbox` imports, and browser inference. Parity and money train neural weights with TensorFlow.js under Bun and ship a separate tiny JavaScript runtime. The money proof learns contextual token labels and uses deterministic normalization. These are controlled research datasets with substantial language-coverage work remaining. See the [training guide and results](docs/neural-training.md) and the [filter guide](docs/end-to-end.md).

## Local development

Use Bun 1.4.2 and Node 24 (`nvm use` reads `.nvmrc`).

```sh
bun install --frozen-lockfile
bun run dev
```

Open <http://127.0.0.1:5173>. All three examples train during startup, then loads a generated model and filters fictional customers locally. Try `active customers and Swedish customers and ARR over 50k`. Open <http://127.0.0.1:5173/training> to try the parity and money models.

```sh
bun run check
bunx playwright install chromium
bun run test:browser
```

`bun run check` runs linting, formatting checks, TypeScript checks, package tests, and production builds. The browser test builds and serves the production example automatically. GitHub Actions runs both checks on pull requests.

The workspace contains `packages/core` for task definitions and runtime, `packages/react` for React integration, `packages/train` for training and the CLI, and `examples/filters` for the React/Vite example. [Repository design](docs/repository-design.md) explains the boundaries, build output, and development workflow. UI source attribution is in [Third-party notices](THIRD-PARTY-NOTICES.md).

## Why Matchbox

Some application features accumulate hundreds of regexes, parser edge cases, precedence rules, semantic mappings, and language-specific heuristics. A general-purpose LLM call can handle ambiguity, but introduces a network dependency, latency, and recurring inference cost.

Matchbox explores the middle ground: small, learned, highly constrained models that are cheap enough to become ordinary software primitives.

The developer defines the problem:

> Here are the inputs I have. Here is the output schema I need. Here are examples of correct behavior. Here are my evals. Make the smallest model that passes them.

The expensive model, if one is used, should ideally be a compiler dependency, not a runtime dependency.

## Core principle

The preferred architecture is hybrid:

```text
Messy input
    ↓
Tiny learned model
    ↓
Candidate recognition / structured prediction
    ↓
Deterministic validation + normalization
    ↓
Strict typed output, or abstention
```

The model handles ambiguity. Normal software handles correctness.

For example, a model could recognize the amount and currency concepts in “around fifteen grand in euros.” A deterministic normalizer would convert those concepts into `{ amount: 15000, currency: "EUR" }`.

Validation guarantees that an output conforms to its schema. It does not guarantee that the model interpreted the input correctly. Held-out evals and graceful uncertainty are essential.

Models must never emit arbitrary SQL, executable code, or unbounded application logic.

## First vertical: natural-language filters

The first demonstration will turn natural language into an application-defined filter AST.

```text
active Swedish customers over 50k ARR
```

```ts
{
  and: [
    { field: "status", operator: "eq", value: "active" },
    { field: "country", operator: "eq", value: "SE" },
    { field: "arr", operator: "gt", value: 50000 },
  ],
}
```

Composition matters. For example:

```text
German or Swedish customers under 50k except churned ones
```

```ts
{
  and: [
    {
      or: [
        { field: "country", operator: "eq", value: "DE" },
        { field: "country", operator: "eq", value: "SE" },
      ],
    },
    { field: "arr", operator: "lt", value: 50000 },
    { field: "status", operator: "neq", value: "churned" },
  ],
}
```

The application owns the fields, allowed operators, value types, and business meaning. Matchbox produces validated data that application code can translate into a query or use to filter a local table.

## The first proof

Before generalizing the framework, establish one credible end-to-end loop:

```text
Examples
  → tiny trained model
  → held-out evaluation
  → packaged browser artifact
  → typed TypeScript API
  → React filter demo
```

The first implementation should:

1. Scaffold a small TypeScript repository with Bun, tests, and CI.
2. Define a minimal filter AST with predicates, AND, OR, and exclusion where needed.
3. Create a meaningful local JSONL dataset and separate held-out evals.
4. Implement a reasonable deterministic filter baseline.
5. Prototype the simplest viable learned parser and compare a small number of approaches.
6. Measure correctness, output validity, artifact size, and browser inference latency.
7. Package the model with a typed wrapper and demonstrate live customer-table filtering in React.
8. Document the tradeoffs before expanding the API or package structure.

The central research question is:

> Can a very small learned model replace a meaningful amount of brittle application parsing logic while remaining tiny, fast, local, typed, and easy to ship?

A model that merely memorizes examples or underperforms a manageable rule implementation does not establish the thesis. If a regex is better, use the regex.

## Proposed developer experience

These interfaces are illustrative and subject to the findings of the first proof.

### Define a task

The implemented `defineParser` accepts explicit string inputs and a constrained structured output schema. See the [parser API guide](docs/parser-api.md) for the supported subset and validation methods. The example below deliberately supports conjunctions only; the filter vertical will also investigate nested AND/OR expressions.

```ts
import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";

const predicate = z.discriminatedUnion("field", [
  z.strictObject({
    field: z.literal("status"),
    operator: z.enum(["eq", "neq"]),
    value: z.enum(["active", "inactive", "churned"]),
  }),
  z.strictObject({
    field: z.literal("country"),
    operator: z.enum(["eq", "neq"]),
    value: z.enum(["SE", "DE"]),
  }),
  z.strictObject({
    field: z.literal("arr"),
    operator: z.enum(["eq", "gt", "gte", "lt", "lte"]),
    value: z.number().finite().nonnegative(),
  }),
]);

export default defineParser({
  input: z.string(),
  output: z.strictObject({ and: z.array(predicate).min(1) }),
  fields: {
    status: { type: "enum" },
    country: { type: "country" },
    arr: {
      type: "money",
      aliases: ["ARR", "annual recurring revenue"],
    },
  },
});
```

The v0 schema subset and metadata format are documented in the [parser API guide](docs/parser-api.md). Field metadata helps describe the task; the output schema remains the contract. Currency conventions, relative dates, and references such as “me” must have explicit application context.

### Provide examples and evals

Training examples live in local JSONL files. Each line contains an input and its expected output:

```jsonl
{"input":"Swedish customers over 50k ARR","output":{"and":[{"field":"country","operator":"eq","value":"SE"},{"field":"arr","operator":"gt","value":50000}]}}
{"input":"inactive customers","output":{"and":[{"field":"status","operator":"eq","value":"inactive"}]}}
```

Keep `evals.jsonl` separate from training data. Validate examples against the task schema and report errors with file and line information. The evaluation format also needs to represent inputs for which abstention is the correct behavior.

The filter dataset should cover enums, countries, numeric comparisons, money, dates, ownership, conjunctions, disjunctions, negation, and ranges as support is added. Include ambiguous, adversarial, and unsupported inputs. Hold out phrasing and compositions, not just random rows from the same templates.

### Train, evaluate, and package

The intended commands are:

```sh
npx matchbox train
npx matchbox eval
```

Conceptually, training will follow this pipeline:

```text
Schema + examples + evals
    ↓
Validate and normalize examples
    ↓
Optional synthetic expansion / teacher labeling
    ↓
Train candidate micro-models
    ↓
Evaluate on held-out data
    ↓
Select the smallest acceptable model
    ↓
Package weights, metadata, and TypeScript bindings
```

Start with one or a few inspectable architectures. Generalized AutoML, teacher integration, and quantization can follow when the first proof justifies them. Any artifact transformation must be evaluated on the artifact that will actually ship.

Synthetic examples must be validated and kept out of held-out evaluation. A teacher model may help generate paraphrases, compositions, and adversarial cases during training. Runtime inference should remain local.

### Import the generated parser

The generated dependency should hide model loading, tokenization, and backend details:

```ts
import filters from "./matchbox/filters";

const result = await filters.parse("active Swedish customers over 50k ARR");

if (result.status === "ok") {
  console.log(result.value);
}
```

A possible result contract is:

```ts
type ParseResult<T> =
  | { status: "ok"; value: T; confidence: number }
  | { status: "uncertain"; value: null; confidence: number };
```

Confidence semantics and thresholds need evaluation. A raw model score must not be presented as a calibrated probability of correctness without evidence.

Invalid predictions must never silently leave the runtime as successful results. Applications decide whether an uncertain parse should trigger a preview, clarification, deterministic fallback, or a larger model call.

### Use it in React

A small integration should make loading and inference straightforward:

```tsx
import { useMatchbox } from "@matchbox-ai/react";
import filters from "./matchbox/filters";

export function CustomerSearch() {
  const parser = useMatchbox(filters);

  return (
    <input
      aria-label="Filter customers"
      onChange={async (event) => {
        const result = await parser.parse(event.target.value);
        console.log(result);
      }}
    />
  );
}
```

The canonical demo should show natural language becoming filter chips and a filtered customer table, with uncertainty visible. The integration must handle model loading, errors, and stale results while the user types.

The intended inference path requires no network roundtrip, token billing, or application text leaving the browser. Initial model delivery may still fetch static assets.

## Architecture research

Do not assume that the model should generate arbitrary JSON. Investigate semantic recognition followed by deterministic compilation:

```text
Swedish    → VALUE(country=SE)
customers  → neutral
 over      → OPERATOR(gt)
50k        → VALUE(number=50000)
ARR        → FIELD(arr)
    ↓
Deterministic AST compiler
    ↓
Schema validation
```

This decomposition may make models smaller and outputs easier to inspect. Correct operator scope, negation, and AND/OR grouping remain part of the problem and must be tested explicitly.

Candidate approaches include a linear or small MLP baseline, token classification with a deterministic AST builder, and a tiny sequence model or constrained decoder. Character-level features and small transformer encoders are also candidates. Start with two or three useful comparisons, not a model zoo.

All learned approaches should be compared with the deterministic baseline on the same held-out inputs. Record which logic remains handcrafted, so a hybrid model does not get credit for work performed by its compiler.

## Evaluation and build reports

Evals determine whether an artifact is useful enough to ship. Among candidates that meet explicit quality thresholds, prefer the smallest useful model.

Reports should include:

- Exact structural match, with AST canonicalization rules stated explicitly.
- Field, operator, and value accuracy where these can be measured meaningfully.
- Invalid predictions before validation and invalid outputs exposed by the runtime.
- Abstention rate and accuracy among accepted predictions.
- Dataset sizes, split provenance, and performance on compositional and ambiguous cases.
- Model bytes and total shipped runtime bytes, with encoding and compression stated.
- Browser inference p50/p95, cold initialization time, and benchmark environment.
- Architecture, training configuration, artifact hash, and reproducibility information.

Abstention must not inflate headline accuracy by silently removing difficult cases. Browser timings must be measured in a browser and distinguished from training-runtime timings. No accuracy, size, or latency targets are claimed yet.

## Browser runtime

The runtime should be small, lazy-loaded, cacheable, worker-friendly, CSP-conscious, and safe to import during SSR. Inference should work without a backend.

Start with the backend that minimizes engineering risk. Optimized JavaScript or WASM may be sufficient for the first model. WebGPU is an option to benchmark, not a requirement.

Embedded weights versus fetched static assets, cache invalidation, and JS/WASM/WebGPU selection remain open decisions. Runtime packaging should be deterministic, and every successful structured result must pass deterministic validation and normalization.

## Scope and repository direction

Keep v0 focused on `defineParser` and the filter demonstration. Use TypeScript and Bun for the repository, with a React example. Separate browser code from training tooling where necessary, but avoid package boundaries that the first proof does not need.

Possible future packages are `@matchbox-ai/core`, `@matchbox-ai/train`, `@matchbox-ai/runtime`, and `@matchbox-ai/react`. These names describe potential responsibilities, not a committed monorepo structure.

Later abstractions might include `defineMatcher`, `defineClassifier`, and `defineRanker`. Later verticals could include date/time parsing, sensitive-span detection, CSV schema inference, clipboard classification, addresses, email structure, logs, product strings, and lightweight ranking. They should wait until the filter MVP works.

Matchbox is not a general LLM framework, agent framework, hosted inference API, vector database, or general-purpose browser AI SDK. Deterministic parsers remain the right choice when they already solve the problem well.

## Open questions

1. Which tiny architecture offers the best accuracy, size, and complexity tradeoff for constrained parsing?
2. Where should learned prediction end and deterministic AST construction begin?
3. How reliably can schemas and sparse examples support synthetic data generation?
4. What teacher-model dependency is acceptable during builds?
5. How should datasets, task definitions, and artifacts be versioned together?
6. Which schema constructs and normalizers can be supported deterministically?
7. How should confidence be calibrated and abstention thresholds selected?
8. When does WebGPU improve end-to-end performance over JS or WASM?
9. Should artifacts be embedded, fetched, or support both, and how should caches update?
10. When is automatic selection of the smallest passing model justified?

## Design values

**Boring runtime.** Using Matchbox should feel like importing a utility function.

**Tiny by default.** Smaller is a product feature.

**Evals over vibes.** A model ships because it passes explicit evals.

**Local-first.** The primary runtime target is the user's device.

**Strict outputs.** Interfaces are typed, validated, and deterministic.

**Hybrid systems.** Learned models handle ambiguity; conventional code handles correctness.

**Graceful uncertainty.** Models may abstain, and applications control escalation.

**Architecture is an implementation detail.** Developers define problems, not neural networks.

**No AI theater.** If a regex is better, use the regex.
