# Matchbox

## Documentation

Keep repository documentation focused on product behavior, public contracts, contributor workflows and reproducible evidence. Keep session handoffs, personal paths, internal PR status and run-by-run decision narratives outside the repository.

## Rust engine

Both sequence and record classifiers use Burn. Rust code lives in the root Cargo workspace under `crates/`: the shared engine, thin Node bindings, and thin WASM bindings. Keep TypeScript-authored supervision, decoders and Zod validation in TypeScript. Run Rust formatting, Clippy and tests in addition to the Bun and browser checks. Generated native binaries, WASM and weights stay out of Git.

## Scope

Build the smallest credible examples-to-browser proof. The README describes the thesis; Linear tracks the tickets. Keep changes within the active ticket. Do not ship fake inference or fabricated benchmark results.

## Repository

- Use Bun workspaces and scripts. Do not add Turborepo.
- Keep portable library code in `packages/core` and the browser-only React/Vite playground in `apps/playground`.
- Use TypeScript for training work. Developers should not need to manage a separate training stack.
- React integration lives in `packages/core/src/react` and is imported from `@matchbox-ai/core/react`. Training primitives live in `packages/train`, exposed as `@matchbox-ai/train`. The CLI, templates, and browser workbench live in `packages/cli`, exposed as `matchbox-ai` with the `matchbox-ai` command.
- Examples live in `examples/is-even`, `examples/filters`, `examples/money`, and `examples/time`; their shared browser demo lives in `apps/playground`. New example conventions are authored `matchbox/<task>/parser.ts` and explicit `pipeline.ts`, independent task-local `evals/`, and ignored project-local `.matchbox/<task>/` artifacts. Keep generated weights out of Git and preserve independent evaluation data when regenerating training examples.
- Train learned examples through the native Burn trainers. The default structured-value trainer has no domain dictionaries; explicit sequence recipes and decoders remain application-owned. Evaluate models against task examples, rejection cases and application requirements; do not maintain rule-parser or lookup comparisons.
- Keep training dependencies out of browser entry points. Cross-package imports use package exports.
- Ship ESM and TypeScript declarations. Use Rolldown for library JavaScript and TypeScript for declarations.
- Consumers import the package through its exports, not aliases pointing into library source.

## Abstraction boundary

Matchbox owns task contracts, explicit authoring primitives, dataset workflows, training orchestration, evaluation, packaging, deterministic validation, abstention, and the typed application API. Burn owns neural-network representation, serialization, loading, and execution.

- Use native Burn for training and Burn WASM CPU for browser inference. Export Burn records and load and execute the models through Burn APIs.
- Do not build or retain a handwritten JS inference engine, manually reconstruct a trained network with matrix operations, or add a runtime/backend selection framework. Sub-millisecond differences between equivalent runtimes do not justify owning that layer.
- Schemas describe valid application output. A declaration such as z.number() must not silently choose digit heads, a numeric representation, or a domain normalizer.
- Expose learning strategies, encoders, supervision, and output transformations as small, documented primitives. Compose consequential choices explicitly in pipeline.ts and application-owned helpers. Agent instructions should guide those choices rather than hide them in framework heuristics.
- Do not fix a model limitation by silently adding dictionaries, regexes, semantic mappings, or automatic numeric encodings. Propose a new primitive with its contract, limitations, and held-out evaluation evidence before implementing it.
- Keep application consumption simple: parser.parse(input) returns typed validated output or uncertainty. Unfamiliar vocabulary is a model-coverage limitation, not invalid user input. Confidence is currently uncalibrated.
- Before adding an abstraction or optimization, identify whether it belongs to Matchbox, Burn, or the authored application pipeline. Keep work within the owning layer.

## Code style

- Use Oxlint for correctness and readability, and Oxfmt for formatting. Run `bun run check` before proposing a PR.
- Do not nest ternaries, including in JSX. Use guard clauses, named values, or focused helpers. Always brace control-flow bodies, use strict equality (`== null` is allowed for nullish checks), and avoid unnecessary else branches after returns. Do not silence these rules to preserve compact code.
- Use kebab-case filenames. Tool-discovered config filenames retain their required names.
- Put each React component in its own file.
- Use pure `index.ts` re-export barrels for library directories. Authored Matchbox task modules are an exception: use `X.ts` or `X/X.ts`, with direct imports and no required barrel.
- Keep files focused. Around 150 lines is a signal to extract related logic.
- Add imports and their usage in the same edit.
- Validate browser integration with `bun run test:browser`.

## Design context

The example is for developers evaluating tiny, typed browser-local models. The bootstrap page demonstrates package consumption only. Keep it minimal and functional, using Fluid Functionalism components. Preserve source attribution when adapting registry code. Follow keyboard accessibility and reduced-motion preferences. Future filter interactions belong to the demo ticket.

## Workflow

Work on a ticket branch and open a PR against `main`. Do not merge without instruction. Keep generated build output out of Git and commit the Bun lockfile. Write documentation in Markdown and use complete sentences without em dashes.

## Authoring API

Every conventional task has an explicit parser and pipeline entry point, each authored as `X.ts` or `X/X.ts`. Token classifiers discover similarly named recipe and decode modules; keep their learning and output transformations explicit. Put module-specific helpers alongside the named entry file, and shared domain code in a named task-level folder such as countries/. Do not put required task contracts in a generic lib/ folder. Use the documented primitives from @matchbox-ai/train. Keep model internals behind @matchbox-ai/core/internal. Public docs live in docs/ and are copied into package builds. The coding-agent workflow lives in skills/matchbox/SKILL.md.

Training-data generators and research runners belong in project-level scripts/, alongside matchbox/, not inside a model/task directory.

## CLI integration

Use Commander for commands and Ink for interactive terminal UI. Scaffolding adds tasks to an existing application; preserve its framework configuration and scripts. The workbench runs separately on loopback. The generated TypeScript wrapper is the default React/Next.js integration; keep Next.js inference in client components. Keep the money CLI template synchronized from examples/money during package builds.

## Releases

Publish only packages/core, packages/train, and packages/cli through Changesets. The CLI package and executable are named matchbox-ai. The three packages share a fixed release version while the API is evolving. Add a changeset for package changes. Keep apps, examples, and the repository root private. The release workflow creates a version PR, verifies and packs after merge, then publishes with npm trusted publishing. Do not publish manually as part of ordinary feature work.
