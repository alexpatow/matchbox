# Matchbox

## Scope

Build the smallest credible examples-to-browser proof. The README describes the thesis; Linear tracks the tickets. Keep changes within the active ticket. Do not ship fake inference or fabricated benchmark results.

## Repository

- Use Bun workspaces and scripts. Do not add Turborepo.
- Keep portable library code in `packages/core` and the browser-only React/Vite example in `examples/filters`.
- Use TypeScript for training work. Developers should not need to manage a separate training stack.
- React integration lives in `packages/react` and is imported from `@matchbox-ai/react`. Training and the CLI live in `packages/train`, exposed as `@matchbox-ai/train`.
- Examples live in `examples/is-even`, `examples/money-simple`, and `examples/money-pipeline`; their shared browser demo remains in `examples/filters`. New example conventions are authored `parser/`, independent `evals/`, and ignored `.matchbox/` artifacts. Keep generated weights out of Git and preserve independent evaluation data when regenerating training examples.
- Train learned examples through the native TensorFlow trainers. The default structured-value trainer has no domain dictionaries; explicit sequence recipes and decoders remain application-owned. Keep deterministic rule parsers only as evaluation baselines.
- Keep training dependencies out of browser entry points. Cross-package imports use package exports.
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
