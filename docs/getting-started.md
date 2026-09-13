# Getting started

Matchbox is currently private and unpublished. In this repository, use Bun 1.4.2 and Node 24, run bun install, then bun run train. Run bun run dev to start the React playground.

To create a working task using the built local CLI:

```sh
bun packages/train/dist/cli.js init money --directory /tmp/my-matchbox-app
cd /tmp/my-matchbox-app
bun install
bunx matchbox train money
bunx matchbox inspect money "around fifteen grand euros"
bunx matchbox dev money
```

For an existing app with the CLI installed, matchbox init money adds matchbox/money and preserves existing files. A colliding task is refused. Init adds package dependencies and generated-artifact ignore rules; local file dependencies point at the installed pre-release packages.

Edit parser.ts to define the Zod input/output contract. Edit pipeline.ts to choose a learning strategy. Add examples to data/train.jsonl and maintain independent validation/test fixtures. No model representation is inferred from z.number().

Configure Vite with the plugin from @matchbox-ai/core/vite and import the generated .matchbox file. See the runtime and React guides. Generated model.ts wrappers are also available for other bundlers.
