import { access, readdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
const exists = (path: string) =>
  access(path).then(
    () => true,
    () => false,
  );
async function select(root: string): Promise<string | undefined> {
  if (await exists(resolve(root, "parser.ts"))) return root;
  if (await exists(resolve(root, "matchbox.config.ts"))) return resolve(root, "matchbox.config.ts");
  const directory = resolve(root, "matchbox");
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const tasks: string[] = [];
  for (const entry of entries)
    if (entry.isDirectory() && (await exists(resolve(directory, entry.name, "parser.ts"))))
      tasks.push(entry.name);
  tasks.sort();
  if (tasks.length > 1)
    throw new Error(`Choose a task: ${tasks.join(", ")}. For example, matchbox train ${tasks[0]}.`);
  return tasks.length ? resolve(directory, tasks[0]!) : undefined;
}
export async function discover(target?: string, cwd = process.cwd()): Promise<string> {
  if (target && (await exists(resolve(cwd, target)))) {
    const path = resolve(cwd, target);
    if ((await stat(path)).isFile()) return path;
    const selected = await select(path);
    if (selected) return selected;
    throw new Error(`No Matchbox task found in ${path}.`);
  }
  let root = resolve(cwd);
  for (;;) {
    if (target) {
      const task = resolve(root, "matchbox", target);
      if (await exists(resolve(task, "parser.ts"))) return task;
    } else {
      const selected = await select(root);
      if (selected) return selected;
    }
    const parent = dirname(root);
    if (parent === root)
      throw new Error(
        target
          ? `Task not found: ${target}.`
          : "No Matchbox project found. Run matchbox init <name>.",
      );
    root = parent;
  }
}
