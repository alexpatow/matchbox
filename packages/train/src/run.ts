import { loadProject } from "./load-project.js";
export async function run(
  command: "train" | "eval",
  path: string,
  progress?: (epoch: number, loss: number) => void,
) {
  const project = await loadProject(path);
  if (project.config.sequence) {
    const { runSequence } = await import("./models/sequence/index.js");
    return runSequence(command, project, progress);
  }
  if (command !== "train")
    throw new Error("Use the eval CLI command to evaluate a saved artifact.");
  const { runRecord } = await import("./models/record/index.js");
  return runRecord(project, progress);
}
