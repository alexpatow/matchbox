import { listTasks } from "@matchbox-ai/train/project";
import { dirname, resolve } from "node:path";
import { terminal } from "./terminal.js";
export async function taskNames(cwd = process.cwd()) {
  let root = resolve(cwd);
  for (;;) {
    const names = await listTasks(root);
    if (names.length) {
      return names;
    }
    const parent = dirname(root);
    if (parent === root) {
      return [];
    }
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
