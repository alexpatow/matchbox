# Runtime API

## MatchboxParser and ParseResult

```ts
// Public types from @matchbox-ai/core/runtime.

type ParseResult<T> =
  | { status: "ok"; value: T; confidence: number }
  | { status: "uncertain"; value: null; confidence: number; reason: string };

interface MatchboxParser<T, Input = string> {
  load?(): Promise<void>;
  parse(input: Input): Promise<ParseResult<T>>;
}
```

The generated module exports a parser. `parse` initializes it when necessary and returns schema-validated output or uncertainty. Confidence is an uncalibrated score, not a probability of correctness. Unknown vocabulary, low scores, or an undecodable prediction can cause uncertainty. Input-constraint failures also return uncertainty; load failures reject the promise. Field and fixed-window token models additionally limit inputs to 512 UTF-16 units. Recurrent limits come from the pipeline.

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

Returns `PartialMatchboxParser<z.output<Output>>` when the artifact has the literal kind `"recurrent-parser"` and a decoder is supplied; otherwise returns `MatchboxParser<z.output<Output>>`. Both include required `load(): Promise<void>` and `dispose(): void`. Most applications should import the generated module instead of calling this factory.

`load` caches initialization and uses Burn WASM CPU. Failed initialization can be retried. `dispose` releases weights; calls after disposal reject. The React hook does not dispose shared module instances on unmount.

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

## PartialMatchboxParser

Generated recurrent models additionally expose `supportsPartial: true` and overloads for explicit partial results and browser GPU execution. Calling `parse(input)` retains `ParseResult<T>` and whole-result acceptance.

```ts
// These types are exported from @matchbox-ai/core/runtime.
interface GpuParseOptions {
  gpu?: boolean;
}
interface PartialParseOptions extends GpuParseOptions {
  allowPartial: boolean;
}
interface UncertainRange {
  start: number;
  end: number;
  confidence: number;
}
interface PartialMatchboxParser<T> extends MatchboxParser<T> {
  readonly supportsPartial: true;
  parse(input: string, options: PartialParseOptions): Promise<PartialParseResult<T>>;
  parse(input: string, options?: GpuParseOptions): Promise<ParseResult<T>>;
}

type PartialParseResult<T> =
  | ParseResult<T>
  | {
      status: "partial";
      value: T;
      confidence: number;
      uncertainRanges: UncertainRange[];
    };
```

The partial value is a schema-validated candidate that still contains uncertain predictions. Adjacent uncertain parts merge into one range with their minimum confidence. Ranges use UTF-16 offsets and describe source parts, not arbitrary output fields. At least one supervised part must clear the threshold; otherwise the result remains `uncertain`. Decoder rejection, schema failure and input-limit failures also remain `uncertain`.

`createParser` returns this type when its artifact argument has the literal kind `"recurrent-parser"` and a decoder is supplied. Generated wrappers and declarations preserve it automatically. Existing model kinds do not accept partial options. The React hook preserves the corresponding overload. See [partial-result semantics and limits](../primitives/recurrent-token-classifier.md#consume-the-model).

## Parse options

These options are supported by recurrent models only. They are independent: GPU execution does not enable partial results.

```ts
import lexer from "./.matchbox/lexer/model";

const strictCpu = await lexer.parse(source);
const partialCpu = await lexer.parse(source, { allowPartial: true });
const strictGpu = await lexer.parse(source, { gpu: true });
const partialGpu = await lexer.parse(source, { gpu: true, allowPartial: true });
```

| Option         | Default | Behavior                                                                                                          |
| -------------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| `allowPartial` | `false` | Allows a validated candidate with uncertain source ranges when at least one supervised part clears the threshold. |
| `gpu`          | `false` | Requests browser WebGPU execution using the same trained weights.                                                 |

`allowPartial: false` retains whole-result acceptance. Because the option's type is boolean, an options object containing `allowPartial` has the broader `PartialParseResult<T>` return type even when the value is false.

CPU and GPU predictors initialize independently and are cached per parser. `load()` warms CPU only. A direct first call with `gpu: true` loads the GPU runtime without loading CPU. Explicit GPU requests reject on unavailable WebGPU or initialization failure, with no silent fallback. An application may catch that error and explicitly retry on CPU.

`dispose()` releases both predictors. GPU calls on one parser are serialized; disposal rejects queued work and releases the GPU predictor after active work finishes. Floating-point differences can affect labels or threshold decisions. See [runtime execution](../runtime-backends.md) for download and timing considerations.

## Structured input

Generated numeric-feature models expose `MatchboxParser<Output, Input>`, with both types inferred from the task schemas. `createParser(artifact, task, encode)` requires the authored `NumericEncoder<z.output<Input>>` as its third argument. Its return type is `MatchboxParser<z.output<Output>, z.input<Input>>` with `load` and `dispose`. See [feature classification](../primitives/feature-classifier.md) for limits and error behavior.
