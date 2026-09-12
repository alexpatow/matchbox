# @matchbox-ai/core

This private workspace package is the starting point for Matchbox's portable TypeScript API.

BOO-30 exports only `version` to exercise packaging. Parser definitions, model loading, and inference are not implemented yet.

```ts
import { version } from "@matchbox-ai/core";
```

`bun run build` emits browser-compatible ESM and TypeScript declarations in `dist/`. The public export points to those files. Consumers do not import source files or depend on Bun.

Runtime source has no ambient Node, Bun, or DOM types. Introduce browser-specific APIs behind explicit initialization boundaries when needed. Keep training code separate from this entry point; extract packages only when an implementation needs them.
