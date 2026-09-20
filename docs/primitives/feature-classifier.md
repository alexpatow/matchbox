# Numeric feature classifier

Use `featureClassifier` for structured inputs with a small, finite output domain. The application owns the numerical representation. Matchbox trains a Burn MLP with one categorical head per output field and runs its exported weights through Burn WASM CPU.

## Author the task

```ts
// matchbox/shapes/parser.ts
import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";

export default defineParser({
  input: z.strictObject({
    points: z
      .array(z.strictObject({ x: z.number(), y: z.number() }))
      .min(2)
      .max(4096),
  }),
  output: z.strictObject({
    kind: z.enum(["ellipse", "rectangle", "triangle", "line", "unknown"]),
  }),
});
```

```ts
// matchbox/shapes/pipeline.ts
import { definePipeline, featureClassifier } from "@matchbox-ai/train";

export default definePipeline({
  prediction: featureClassifier({ encode: "./encode", threshold: 0.8 }),
  acceptance: { minAccuracy: 0.9, maxBytes: 24000 },
});
```

`encode` defaults to `./encode` and resolves `encode.ts` or `encode/encode.ts` relative to the task directory. `threshold` defaults to `0.75` and accepts values from 0 to 1. Both choices are explicit; the input schema does not select an encoder.

## Encoder contract

The encoder module default-exports an object satisfying this public type from `@matchbox-ai/core`:

```ts
interface NumericEncoder<Input> {
  readonly size: number;
  encode(input: Input): readonly number[];
}
```

`size` must be an integer from 1 through 10,000. Every call must return exactly that many finite float32-representable numbers. Invalid dimensions or non-finite features throw a programming error, rather than reporting model uncertainty. The encoder receives the schema-validated input, including supported defaults. Type an authored encoder as `NumericEncoder<z.output<typeof task.input>>`; `InferInput<typeof task>` instead describes what the caller supplies before defaults are applied.

The same module executes during training and browser inference. Keep it synchronous, deterministic, browser-safe and free of training dependencies. Retrain after changing it. The artifact records its module path and feature count, not its source or a source hash. Changing an encoder without retraining can change predictions even if dimensions stay the same.

The [sketch example](../examples/sketch.md) centers and uniformly scales points, resamples by path distance, and produces a soft occupancy grid. See its [complete encoder](https://github.com/alexpatow/matchbox/blob/main/examples/sketch/matchbox/shapes/encode.ts). These operations belong to the example, not the framework. If another application needs fitted preprocessing, fit it on training data only and explicitly persist the fitted constants in its encoder module.

## Train and consume

JSONL rows retain `{ "input": ..., "output": ... }`; `input` can now be an object. Train, validation and test must be separate. Overlap checks compare structured inputs by canonical JSON, ignoring object property order but preserving array order and string values inside objects.

```sh
bunx matchbox-ai train shapes
bunx matchbox-ai eval shapes
bunx matchbox-ai parse shapes '{"points":[{"x":0,"y":0},{"x":20,"y":10}]}'
```

CLI input arguments use JSON for non-string schemas. The workbench labels its input editor as JSON for these tasks. Text task arguments remain plain text.

```ts
import shapes from "./.matchbox/shapes/model";
const result = await shapes.parse({
  points: [
    { x: 0, y: 0 },
    { x: 100, y: 50 },
  ],
});
```

The generated wrapper and `.matchbox` import infer both input and output types. `useMatchbox` preserves that input type. For manual loading, pass the encoder as the third argument to `createParser(artifact, task, encode)`.

Outputs must be strict flat objects with primitive values. Each field chooses a value observed in training; this is classification, not numerical regression. There are at most 32 fields and 256 observed values per field. The model has one hidden layer with 32 units and uses the existing native Burn record trainer (seed 42, 100 epochs, batch size 128, learning rate 0.02).

Low model confidence returns uncertainty. An application can explicitly train an `unknown` class; that class is an ordinary successful model output, which the application may interpret as rejection. Input schema failures return uncertainty; encoder errors and loading failures reject. Confidence remains uncalibrated. Feature models do not support partial results or WebGPU options.
