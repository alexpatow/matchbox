# Dataset format

Matchbox dataset format version 1 uses separate local `train.jsonl` and `evals.jsonl` files. Each nonblank line is one JSON object with exactly two properties: `input` and `output`.

```jsonl
{"input":"Swedish customers","output":{"country":"SE"}}
{"input":"German customers","output":{"country":"DE"}}
```

`input` must satisfy the task's string schema. `output` must satisfy its structured output schema. There are no row headers, split labels, IDs, or metadata properties in version 1. Application-specific fields belong inside `output` and must be declared by the task.

## Authoring rules

Write UTF-8 text without a byte-order mark, with LF or CRLF line endings. Empty and whitespace-only lines are ignored. Diagnostics still count those physical lines. Each split must contain at least one example. A final newline is optional.

Use `JSON.stringify({ input, output })` to generate each row. Newlines within an input string must be JSON escapes, rather than physical line breaks. Pretty-printed multiline objects and comments are rejected. Input whitespace, row order, and duplicate examples are preserved. Use unique object property names; parsing uses standard `JSON.parse` semantics, which retain the last occurrence of duplicate keys.

## Validation API

```ts
import { defineParser, parseDatasets } from "@matchbox-ai/core";
import { z } from "zod";

const task = defineParser({
  input: z.string().min(1),
  output: z.strictObject({ country: z.enum(["SE", "DE"]) }),
});

// File loading is the caller's responsibility. This example runs in Bun.
const result = parseDatasets(task, {
  formatVersion: 1,
  train: { source: "train.jsonl", text: await Bun.file("train.jsonl").text() },
  eval: { source: "evals.jsonl", text: await Bun.file("evals.jsonl").text() },
});

if (result.success) {
  const trainingExamples = result.data.train;
  const heldOutExamples = result.data.eval;
  // Both collections infer output.country as "SE" | "DE".
  console.log(trainingExamples.length, heldOutExamples.length);
} else {
  for (const issue of result.issues) {
    console.error(issue.source, issue.line, issue.path, issue.message);
  }
}
```

The function accepts text and performs no filesystem access, network requests, or model inference. `source` is a diagnostic label, normally the filename. Validation collects issues from both splits and returns no partial dataset on failure. Each issue includes its split, source, one-based physical line number, code, schema path, and message. Empty sources report line 1. Schema paths begin with `input` or `output`; syntax and envelope errors use an empty path.

## Train and eval separation

Both splits are explicit and required. Matchbox does not shuffle, merge, deduplicate, or automatically split them. Keep held-out examples separate from training and synthetic expansion. Authors are responsible for preventing overlap and paraphrase leakage; validation establishes structural correctness, not evaluation independence. Automatic holdout selection and leakage diagnostics can be designed with the training ticket.

## Versioning

The required `formatVersion: 1` in the dataset configuration describes both sources. Keep that configuration under version control alongside the JSONL files and task definition. Raw JSONL files are not self-describing; preserve their configuration when sharing them. No implicit version is assumed. Missing or unsupported versions throw a `RangeError` before rows are read. Invalid rows return validation issues instead.

Breaking changes to row structure or interpretation require a new format version and explicit migration. Do not silently reinterpret existing files. Dataset format versions are independent of package versions and the task metadata's format version. Business-schema changes require revalidation of both datasets against the updated task. Artifact hashes and provenance belong to the build metadata ticket.
