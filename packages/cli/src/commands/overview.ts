import { access, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { terminal } from "./terminal.js";
export async function taskNames(cwd = process.cwd()) {
  let root = resolve(cwd);
  for (;;) {
    const entries = await readdir(resolve(root, "matchbox"), { withFileTypes: true }).catch(
      () => [],
    );
    const candidates = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    const names = (
      await Promise.all(
        candidates.map(
          async (name) =>
            await access(resolve(root, "matchbox", name, "parser.ts")).then(
              () => name,
              () => null,
            ),
        ),
      )
    )
      .filter((name): name is string => name !== null)
      .sort();
    if (names.length) return names;
    const parent = dirname(root);
    if (parent === root) return [];
    root = parent;
  }
}
export async function overview() {
  const names = await taskNames();
  const view = terminal(
    "Build small models for the browser",
    names.length
      ? [
          `Tasks: ${names.join(", ")}`,
          `Open the workbench: matchbox-ai dev ${names[0]}`,
          "Use matchbox --help for commands.",
        ]
      : [
          "Add a task from your app directory: matchbox-ai init",
          "Use matchbox --help for commands.",
        ],
  );
  view.stop();
}
