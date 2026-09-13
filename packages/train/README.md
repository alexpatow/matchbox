# @matchbox-ai/train

The Bun-based Matchbox training package owns the `matchbox` executable and training configuration types.

```ts
import type { TrainingConfig } from "@matchbox-ai/train";
```

In this workspace, run `bun run train` to build the packages and train the filter example. The executable supports `matchbox train [config]` and `matchbox eval [config]`. It generates the model artifact, typed declarations, a TypeScript wrapper, and evaluation metadata. See the [end-to-end guide](../../docs/end-to-end.md).

Training imports the shared feature encoder and artifact contract through core's runtime export, so training and inference use identical preprocessing. No training module is imported by core or the React integration.
