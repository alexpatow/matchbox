# Parser task API

`defineParser` describes a constrained parsing task. It validates inputs and expected outputs and exports training metadata. It does not train a model or infer a result from natural language.

```ts
import { defineParser, type InferOutput } from "@matchbox-ai/core";
import { z } from "zod";

const task = defineParser({
  input: z.string().min(1).max(200),
  output: z.strictObject({
    country: z.enum(["SE", "DE"]),
    minimum: z.number().nonnegative(),
    owner: z.string().nullable().optional(),
  }),
});

type Output = InferOutput<typeof task>;
// { country: "SE" | "DE"; minimum: number; owner?: string | null | undefined }

const input = task.validateInput("Swedish customers above 50k");
const expected = task.validateOutput({ country: "SE", minimum: 50000 });
if (expected.success) {
  const value: Output = expected.data;
  console.log(value);
} else {
  console.log(expected.issues); // Each issue has code, path, and message.
}

const metadata = task.toJSON();
const serialized = JSON.stringify(task); // Uses the same metadata representation.
```

Validation returns a discriminated `ValidationResult<T>`. Invalid task definitions throw `TypeError` at definition time with a schema path. Invalid example values return issues rather than being silently normalized. The task definition has no inference method; call `parse` on the generated model instead.

## Arguments and return value

`defineParser(config: ParserConfig<Output, Input>): ParserDefinition<Output, Input>` is exported from `@matchbox-ai/core`.

| Argument | Required | Contract                                              |
| -------- | -------- | ----------------------------------------------------- |
| `input`  | Yes.     | A supported JSON-compatible Zod schema.               |
| `output` | Yes.     | A supported structured Zod schema.                    |
| `fields` | No.      | `Record<string, FieldMetadata>`; inert metadata only. |

`FieldMetadata` has optional `type: string`, `aliases: readonly string[]`, and `description: string`. Metadata never enables money parsing or other domain behavior.

The result exposes `kind: "parser"`, `input`, `output`, `validateInput(unknown)`, `validateOutput(unknown)`, and `toJSON()`. Validation returns `{ success: true, data }` or `{ success: false, issues }`, where every `ValidationIssue` has `code`, `path`, and `message`. `InferOutput<typeof task>` derives the validated output type. `InferInput<typeof task>` derives the application input type. `ParserMetadata` is the detached JSON representation shown below.

## Supported schemas

Input supports the same JSON-compatible schema subset as output, including strict objects and arrays. Text classifiers require string input; structured inputs require an explicit numeric encoder. The output root must be a strict object, array, or union of objects/arrays.

Within input and output schemas, Matchbox supports:

- Strict objects with declared properties, including nested objects.
- Arrays and ordinary or discriminated unions.
- Strings, finite numbers, booleans, null, JSON literals, and enums.
- Defaults directly on boolean object properties, applied when the property is omitted.
- Nullable values and optional object properties. Put `.optional()` outermost and omit absent properties; explicit `undefined` is rejected.
- Finite numeric bounds, safe integers, string/array lengths, and regular expressions without flags.

Use `z.strictObject()` or `.strict()`. Ordinary `z.object()` strips unknown keys, while the serialized output contract disallows them. Requiring strict objects keeps validation behavior explicit.

Unsupported schemas fail at definition time. This includes transforms, overwrites such as `.trim()`, coercion, non-boolean defaults, catches, custom/async refinements, conditional checks, arbitrary unknown/any values, dates, bigint, records, maps, sets, tuples, intersections, lazy/recursive schemas, readonly wrappers, and string formats other than flagless regexes.

Both schema and data traversal are limited to 64 nested containers. Validation accepts plain JSON data, not class instances, accessors, sparse arrays, symbol properties, or circular references. `__proto__` is reserved because Zod omits it while constructing parsed objects.

## Training metadata

The serialized definition contains:

```ts
{
  formatVersion: 1,
  kind: "parser",
  input: { /* JSON Schema draft 2020-12 */ },
  output: { /* JSON Schema draft 2020-12 */ },
  fields: {},
}
```

Metadata is captured at definition time. Every `toJSON()` call returns a detached copy. Treat the supplied Zod schemas as immutable after definition; use Zod's schema-building methods to create a new task when its contract changes.

The format version identifies Matchbox's metadata representation, not a model or dataset version. Artifact loading rejects unsupported format versions. The generated wrapper imports the authored task to validate model output.

Zod's global metadata registry is intentionally excluded. `.meta()` must not override structural keywords or inject values that are not JSON. Descriptions, aliases, and semantic types belong in the optional `fields` object for now. Those hints are inert, copied JSON. Matchbox does not infer a field-to-output mapping or normalize money/countries from their names.
