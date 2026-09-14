# Runtime API

## MatchboxParser and ParseResult

```ts
import type { MatchboxParser, ParseResult } from "@matchbox-ai/core/runtime";

type ParseResult<T> =
  | { status: "ok"; value: T; confidence: number }
  | { status: "uncertain"; value: null; confidence: number; reason: string };

interface MatchboxParser<T> {
  load?(): Promise<void>;
  parse(input: string): Promise<ParseResult<T>>;
}
```

The generated module exports a parser. `parse` initializes it when necessary and returns schema-validated output or uncertainty. Confidence is an uncalibrated score, not a probability of correctness. Unknown vocabulary, low scores, or an undecodable prediction can cause uncertainty. A string that fails the task's input constraints also returns uncertainty; load failures reject the promise.

## createParser

```ts
import { createParser } from "@matchbox-ai/core/runtime";
const parser = createParser(artifact, task, decode);
await parser.load();
const result = await parser.parse("for 90 minutes");
parser.dispose();
```

| Argument   | Type                         | Behavior                                                 |
| ---------- | ---------------------------- | -------------------------------------------------------- |
| `artifact` | `unknown`                    | Parsed Matchbox model artifact, validated by the loader. |
| `task`     | `ParserDefinition<Output>`   | Must match the artifact's serialized task metadata.      |
| `decode`   | `SequenceDecoder`, optional. | Required for token models; omit for field models.        |

Returns `MatchboxParser<z.output<Output>>` plus required `load(): Promise<void>` and `dispose(): void`. Most applications should import the generated module instead of calling this factory.

`load` caches initialization and uses TensorFlow.js CPU. Failed initialization can be retried. `dispose` releases weights; calls after disposal reject. The React hook does not dispose shared module instances on unmount.

Malformed artifacts, schema mismatches, and a missing token decoder throw during parser creation. No runtime network API or API key is required. Your bundler may fetch the model's static chunks during loading.

## compileClauses

`compileClauses(input, recognize)` is a filter-specific helper. `recognize(clause)` returns `{ value: Predicate | null, confidence: number }`. It returns `{ value: FilterExpression | null, confidence: number }` with the minimum clause confidence.

```ts
interface Predicate {
  field: string;
  operator: string;
  value: string | number | boolean;
}
type FilterExpression =
  Predicate | { and: Predicate[] } | { or: (Predicate | { and: Predicate[] })[] };
```

It splits explicit `and`/`or` clauses with AND precedence. Empty input, input over 500 characters, more than eight clauses, parentheses, semicolons, and newlines return `null` with confidence zero. Implicit conjunctions and general recursive ASTs are unsupported. It never generates SQL.
