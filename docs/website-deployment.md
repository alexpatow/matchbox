# Website deployment

The `matchbox` project in the Boolean Industries Vercel team is connected to `alexpatow/matchbox`. Pull requests receive preview deployments, and `main` is the production branch.

The project root is the repository root. `vercel.json` installs dependencies with the frozen Bun lockfile, builds the packages, trains the example models, and builds the React/Vite website in `apps/playground`. Vercel serves `apps/playground/dist` as static files. Training runs only during the build; inference runs in the browser.

Installation and builds pin Bun 1.4.2 because Vercel's bundled Bun may not support the repository's lockfile version. Keep this pin aligned with `packageManager` in the root `package.json`. The Vercel project uses Node.js 24.

The SPA rewrite supports direct links to documentation routes. The small example models are retrained at build time. The lexer demo restores a previously evaluated model from the public `lexer-demo-0.4.0` GitHub release. Its URL, byte count and SHA-256 are pinned in `apps/playground/src/lexer/model-manifest.json`; the build verifies the checksum before caching or serving it. Missing assets and checksum mismatches fail the build. Generated weights stay out of Git. No application secrets are required.

To link a local checkout, run `vercel link --project matchbox --scope boolean-industries`. The generated `.vercel/` directory is ignored. Use `vercel deploy --target preview --scope boolean-industries` for a manual preview.

The Vite build also emits `/llms.txt`, `/docs/*.md` (including nested pages), and `/skills/matchbox/SKILL.md` from the authored documentation. These static files take precedence over the SPA fallback. The development server exposes the same paths. Every rendered documentation page offers Copy as Markdown with checkmark confirmation.
