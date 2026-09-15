# Releases

Changesets versions and publishes three packages together:

| Package              | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `@matchbox-ai/core`  | Task contracts and browser runtime.          |
| `@matchbox-ai/train` | Pipeline authoring and Burn training.        |
| `matchbox-ai`        | The CLI, scaffolding, and browser workbench. |

The repository root, apps, and examples remain private. Packages use the MIT license. Initial versions are 0.0.0; the initial changeset proposes 0.1.0.

## Normal workflow

1. Run `bun run changeset` alongside a package change and commit its Markdown file.
2. Merge the feature PR. GitHub Actions creates or updates a Version Packages PR with versions, changelogs, dependency ranges, and the Bun lockfile.
3. Merge the version PR when the release is ready. The release workflow builds every native target, tests installed package archives on each target, runs the full checks and browser tests, then packs and publishes to npm. Changesets creates package tags and GitHub releases.
4. Retry a failed publication with Run workflow on `release.yml` from main. Changesets checks the registry and skips already published versions.

The packages use a fixed version group while their APIs evolve. Internal dependency ranges are updated by Changesets. Run `bun run changeset status` to inspect the next release. Run `bun run release:pack` after collecting all native artifacts to inspect publishable archives without publishing. A local build contains only the current platform; the release guard rejects incomplete distributions.

## npm and GitHub setup

Ensure you control `matchbox-ai` and the `@matchbox-ai` scope. Enable **Allow GitHub Actions to create and approve pull requests** in the repository's Actions settings.

For each npm package, configure a GitHub trusted publisher with:

- Owner: `alexpatow`.
- Repository: `matchbox`.
- Workflow filename: `release.yml`.
- Environment: leave blank.
- Allowed action: enable direct `npm publish`.

The workflow uses Node 24 and npm OIDC authentication. No npm token is stored in GitHub. Only the publish job receives `id-token: write`; build and validation run separately. The repository is currently private, so provenance is disabled for it. The workflow enables provenance if the repository becomes public.

Trusted publisher settings are configured per existing npm package. If the names have not been published yet, bootstrap the first version from the merged Version Packages commit using an authenticated npm account with access to the names:

```sh
bun install --frozen-lockfile
bun run check
bun run test:browser
npm login
bun run release
```

Complete npm's authentication prompts, then configure the three trusted publishers for subsequent releases. Do not run `release` from a feature branch or publish version 0.0.0. Setting up this workflow does not itself claim npm names or configure their trusted publishers.

The CLI declares its training and runtime dependencies so `bunx matchbox-ai init` can work before the app has any Matchbox packages installed. Scaffolding writes registry versions from the running release, preserving dependencies already present in the app.

This follows [Changesets' automation guide](https://changesets.dev/guide/automating) and [npm's trusted publishing setup](https://docs.npmjs.com/trusted-publishers/).
