import { textProject } from "./text-project.js";
import { loadProject } from "./load-project.js";
export async function run(
  command: "train" | "eval",
  path: string,
  progress?: (epoch: number, loss: number) => void,
) {
  const loaded = await loadProject(path);
  if (loaded.config.features) {
    if (command !== "train") {
      throw new Error("Use the eval CLI command to evaluate a saved artifact.");
    }
    const { runFeatures } = await import("./models/features/run.js");
    return runFeatures(loaded, progress);
  }
  const project = textProject(loaded);
  if (project.config.sequence?.recurrent) {
    const { runRecurrent } = await import("./models/recurrent/run.js");
    return runRecurrent(command, project, progress);
  }
  if (project.config.sequence) {
    const { runSequence } = await import("./models/sequence/index.js");
    return runSequence(command, project, progress);
  }
  if (command !== "train") {
    throw new Error("Use the eval CLI command to evaluate a saved artifact.");
  }
  const { runRecord } = await import("./models/record/index.js");
  return runRecord(project, progress);
}
