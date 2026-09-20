# Vite integration

The generated `model.ts` wrapper works without a plugin. Use this optional plugin to import `.matchbox` files directly.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { matchbox } from "@matchbox-ai/core/vite";

export default defineConfig({ plugins: [matchbox()] });
```

`matchbox()` takes no arguments and returns a Vite plugin. It converts `.matchbox` artifact imports into typed runtime modules.

```ts
import model from "./.matchbox/money/model.matchbox";
const result = await model.parse("twenty dollars");
```

Train before starting Vite or building the app. The generated declaration accompanies the artifact; set `allowArbitraryExtensions: true` in your TypeScript configuration for these imports. Keep the schema and any encoder or decoder at their expected relative paths. Both the wrapper and direct artifact import preserve object input types for numeric feature models.
