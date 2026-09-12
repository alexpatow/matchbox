# Repository design

These decisions implement BOO-30 and the repo setup agreed with Alex on 2026-09-13.

## Two workspaces

`packages/core` owns the portable TypeScript library. `examples/filters` owns the browser-only React/Vite app. Bun manages installation and scripts. Runtime and training can separate later when real code needs that boundary; there are no empty placeholder packages.

The foundation started with a bootstrap version export. BOO-31 adds the [parser task API](parser-api.md), including validation and serializable training metadata. The AST, datasets, training, runtime, and React hook remain separate Linear work.

## Package consumption

Rolldown bundles the library to ESM. TypeScript emits declarations. The package export map points to `dist/` in development and production, so the example exercises the actual package boundary. Root build scripts respect the workspace dependency graph. `bun run dev` builds core once before starting its JavaScript/declaration watchers and the Vite server together.

The core watchers refresh both JavaScript and declarations after source changes. Bun runs the two watch commands together, without an additional task orchestrator.

Library source typechecking has no ambient Bun, Node, or DOM globals. Browser-specific initialization must be explicit when it arrives. Training remains TypeScript and must not be re-exported through the browser entry point.

The package targets ES2022 ESM with no CommonJS entry point. Node 24 is the initial tested Node consumer and tooling version. Browser integration runs in Chromium at desktop and mobile viewport sizes. Other browsers remain unverified.

## Tooling and verification

Oxlint checks correctness, React hooks, and accessibility. Oxfmt owns formatting. TypeScript checks types separately from bundling. Bun tests verify the built export map and Node consumption; Playwright exercises the production Vite build through an actual browser.

GitHub Actions installs the frozen Bun lockfile, runs the same local checks, and runs the Chromium smoke test. No publishing or deployment workflow is configured. Both workspaces remain private until a release is explicitly planned.

## Example UI

A small Fluid Functionalism button checks the imported core version and exercises task definition, validation, and serialization in the browser. The page deliberately contains no parser input or inference results yet. Registry source provenance and modifications are recorded in `THIRD-PARTY-NOTICES.md`. UI dependencies belong only to the example.

## References

- [Bun workspace dependency ordering](https://bun.com/docs/pm/filter) informs the root build and dev scripts.
- [Rolldown configuration](https://rolldown.rs/guide/getting-started) describes the ESM library build.
- [Vite](https://vite.dev/guide/) supplies the browser dev server and static production build.
- [Oxlint](https://oxc.rs/docs/guide/usage/linter) and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter) provide linting and formatting.
- [Fluid Functionalism](https://www.fluidfunctionalism.com/docs/button) supplies the adapted button component.
