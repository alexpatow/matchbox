# @matchbox-ai/core

Matchbox's portable TypeScript task-definition package currently exports `defineParser`, `InferOutput`, validation/metadata types, and a bootstrap `version` value.

```ts
import { defineParser, type InferOutput } from "@matchbox-ai/core";
import { z } from "zod";

const task = defineParser({
  input: z.string().min(1),
  output: z.strictObject({ country: z.enum(["SE", "DE"]) }),
});

type Output = InferOutput<typeof task>;
const result = task.validateOutput({ country: "SE" });
const trainingMetadata = JSON.stringify(task);
```

See the repository's [parser API guide](../../docs/parser-api.md) for the supported subset, validation results, and versioned metadata format. Task definitions do not perform inference.

`bun run build` emits browser-compatible ESM and TypeScript declarations in `dist/`. Zod is an external dependency. Consumers import through the public export map and do not depend on Bun. Runtime source has no ambient Node, Bun, or DOM types.

`parseDatasets` validates separate JSONL training and evaluation sources against a task. See the [dataset format guide](../../docs/dataset-format.md) for authoring rules, diagnostics, and versioning.

The package now exports `@matchbox-ai/core/runtime`, `@matchbox-ai/core/react`, `@matchbox-ai/core/vite`, and `@matchbox-ai/core/train`. The Vite plugin turns generated `.matchbox` artifacts into typed parser modules. Training is Bun-based and stays outside the browser graph. See the [end-to-end guide](../../docs/end-to-end.md).
