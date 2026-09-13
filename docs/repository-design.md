# Repository design

These decisions implement BOO-30 and the repo setup agreed with Alex on 2026-09-13.

## Two workspaces

`packages/core` owns the portable TypeScript library. `examples/filters` owns the browser-only React/Vite app. Bun manages installation and scripts. Runtime, React, training, and Vite tooling use separate package subpath exports, without introducing additional workspaces.

The foundation started with a bootstrap version export. BOO-31 adds the [parser task API](parser-api.md), including validation and serializable training metadata. BOO-32 adds versioned datasets. BOO-46 connects the first learned filter flow, described in the [end-to-end guide](end-to-end.md).

## Package consumption

Rolldown bundles the library to ESM. TypeScript emits declarations. The package export map points to `dist/` in development and production, so the example exercises the actual package boundary. Root build scripts respect the workspace dependency graph. `bun run dev` builds core and trains the example once before starting its JavaScript/declaration watchers and the Vite server together.

The core watchers refresh both JavaScript and declarations after source changes. Bun runs the two watch commands together, without an additional task orchestrator.

Portable library source typechecking has no ambient Bun, Node, or DOM globals. Training and Vite modules are checked separately with Node types and built for Node. The CLI runs with Bun to load TypeScript project files. React is an optional peer dependency used only through the React subpath. Training is not re-exported through browser entry points.

The package targets ES2022 ESM with no CommonJS entry point. Node 24 is the initial tested Node consumer and tooling version. Browser integration runs in Chromium at desktop and mobile viewport sizes. Other browsers remain unverified.

## Tooling and verification

Oxlint checks correctness, React hooks, and accessibility. Oxfmt owns formatting. TypeScript checks types separately from bundling. Bun tests verify the built export map and Node consumption; Playwright exercises the production Vite build through an actual browser.

GitHub Actions installs the frozen Bun lockfile, runs the same local checks, and runs the Chromium smoke test. No publishing or deployment workflow is configured. Both workspaces remain private until a release is explicitly planned.

## Example UI

The Fluid Functionalism controls now drive a local learned filter parser, explicit filter chips, and a fictional customer table. Empty and uncertain states show all rows. Registry source provenance and modifications are recorded in `THIRD-PARTY-NOTICES.md`. UI dependencies belong only to the example.

## References

- [Bun workspace dependency ordering](https://bun.com/docs/pm/filter) informs the root build and dev scripts.
- [Rolldown configuration](https://rolldown.rs/guide/getting-started) describes the ESM library build.
- [Vite](https://vite.dev/guide/) supplies the browser dev server and static production build.
- [Oxlint](https://oxc.rs/docs/guide/usage/linter) and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter) provide linting and formatting.
- [Fluid Functionalism](https://www.fluidfunctionalism.com/docs/button) supplies the adapted button component.
