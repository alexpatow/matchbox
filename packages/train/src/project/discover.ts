import { access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
export async function discover(config?: string, cwd = process.cwd()): Promise<string> {
  if (config) {
    const path = resolve(cwd, config);
    await access(path).catch(() => {
      throw new Error(`Config not found: ${path}`);
    });
    return path;
  }
  let root = resolve(cwd);
  for (;;) {
    const path = resolve(root, "matchbox.config.ts");
    if (
      await access(path).then(
        () => true,
        () => false,
      )
    )
      return path;
    if (
      await access(resolve(root, "parser/parser.ts")).then(
        () => true,
        () => false,
      )
    )
      return root;
    const parent = dirname(root);
    if (parent === root)
      throw new Error(
        "No Matchbox project found. Run matchbox init <directory>, or pass --config <path>.",
      );
    root = parent;
  }
}
