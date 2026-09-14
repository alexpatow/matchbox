# Repository design

Bun workspaces contain three framework packages. packages/core owns parser definitions, datasets, TensorFlow model loading, React, and Vite integration. packages/train owns explicit pipeline primitives, native training, evaluation, and packaging. packages/cli owns the command-line workflow, scaffolding templates, and browser workbench. It calls the train and evaluate APIs from @matchbox-ai/train and project loading from @matchbox-ai/train/project. Cross-package imports use exports. Core/internal is reserved for framework implementation, while runtime exports stay application-facing.

Each examples/<example>/matchbox/<task> is independently trainable through the same CLI conventions. apps/playground hosts the React/Vite demo and imports generated artifacts from examples. apps/benchmarks measures browser inference separately. No training dependencies enter the playground browser graph.

Core source is organized under parser/, runtime/tensorflow/, react/, vite/, dataset/, and internal/. Train source separates pipeline/, encoders/, models/, codecs/, evaluation/, packaging/, and project/. CLI source separates commands/ and workbench/, with the browser UI in packages/cli/workbench/. Public index.ts files only re-export. Existing token codecs remain application-owned.

Rolldown builds ESM and TypeScript emits declarations. Public docs are copied into each package during builds for coding-agent access; root docs/ remains the source of truth. The skill lives in skills/matchbox/SKILL.md. Generated weights and copied package docs remain ignored.

Run bun run check and bun run test:browser before proposing a PR. Do not merge without instruction. Preserve independent evaluation fixtures during migrations and training-data regeneration.
