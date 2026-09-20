import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const root = new URL("../../../", import.meta.url);
const origin = "https://matchbox.alexpatow.com";

async function documentationAssets() {
  const files = new Map<string, string>();
  const directory = fileURLToPath(new URL("docs/", root));
  const entries = await readdir(directory, { recursive: true });
  for (const entry of entries.sort()) {
    if (entry.endsWith(".md")) {
      files.set(`/docs/${entry}`, await readFile(`${directory}/${entry}`, "utf8"));
    }
  }
  files.set(
    "/skills/matchbox/SKILL.md",
    await readFile(new URL("skills/matchbox/SKILL.md", root), "utf8"),
  );
  const index = [
    "# Matchbox",
    "",
    "> Train small task-specific models from examples and run them locally in web applications.",
    "",
    "Use installed package docs for version-matched APIs. Website docs follow main.",
    "",
    "## Start here",
    `- [Overview](${origin}/docs/README.md)`,
    `- [Getting started](${origin}/docs/getting-started.md)`,
    `- [Agent setup](${origin}/docs/agents.md)`,
    `- [Skill](${origin}/skills/matchbox/SKILL.md)`,
    "",
    "## Documentation",
    ...[...files]
      .filter(([path]) => path.startsWith("/docs/"))
      .map(([path, source]) => {
        const title = source.match(/^# (.+)/m)?.[1] ?? path;
        return `- [${title}](${origin}${path})`;
      }),
    "",
  ];
  files.set("/llms.txt", index.join("\n"));
  return files;
}

export function documentation(): Plugin {
  return {
    name: "matchbox-documentation",
    async generateBundle() {
      for (const [path, source] of await documentationAssets()) {
        this.emitFile({ type: "asset", fileName: path.slice(1), source });
      }
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const path = new URL(request.url ?? "/", "http://localhost").pathname;
        if (path !== "/llms.txt" && !path.endsWith(".md")) {
          next();
          return;
        }
        try {
          const source = (await documentationAssets()).get(path);
          if (source === undefined) {
            next();
            return;
          }
          response.setHeader("Content-Type", "text/plain; charset=utf-8");
          response.end(source);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}
