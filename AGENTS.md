# Matchbox

## Scope

Build the smallest credible examples-to-browser proof. The README describes the thesis; Linear tracks the tickets. Keep changes within the active ticket. Do not ship fake inference or fabricated benchmark results.

## Repository

- Use Bun workspaces and scripts. Do not add Turborepo.
- Keep portable library code in `packages/core` and the browser-only React/Vite example in `examples/filters`.
- Use TypeScript for training work. Developers should not need to manage a separate training stack.
- Keep training dependencies out of the browser entry point. Extract packages only when implementation warrants them.
- Ship ESM and TypeScript declarations. Use Rolldown for library JavaScript and TypeScript for declarations.
- Consumers import the package through its exports, not aliases pointing into library source.

## Code style

- Use Oxlint and Oxfmt. Run `bun run check` before proposing a PR.
- Use kebab-case filenames. Tool-discovered config filenames retain their required names.
- Put each React component in its own file.
- Use pure `index.ts` re-export barrels for directories. Consumers import from the directory.
- Keep files focused. Around 150 lines is a signal to extract related logic.
- Add imports and their usage in the same edit.
- Validate browser integration with `bun run test:browser`.

## Design context

The example is for developers evaluating tiny, typed browser-local models. The bootstrap page demonstrates package consumption only. Keep it minimal and functional, using Fluid Functionalism components. Preserve source attribution when adapting registry code. Follow keyboard accessibility and reduced-motion preferences. Future filter interactions belong to the demo ticket.

## Workflow

Work on a ticket branch and open a PR against `main`. Do not merge without instruction. Keep generated build output out of Git and commit the Bun lockfile. Write documentation in Markdown and use complete sentences without em dashes.
