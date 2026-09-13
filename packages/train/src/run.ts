import { loadProject } from "./load-project.js";
import { runSequence } from "./sequence/index.js";
export async function run(command: "train" | "eval", path: string) {
  return runSequence(command, await loadProject(path), path);
}
