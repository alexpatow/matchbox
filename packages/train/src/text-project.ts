import type { z } from "zod";
import type { ParserDefinition, DatasetExample } from "@matchbox-ai/core";
import type { loadProject } from "./load-project.js";
type Project = Awaited<ReturnType<typeof loadProject>>;
export function textProject(project: Project) {
  if (project.task.toJSON().input.type !== "string") {
    throw new Error(
      "Text classifiers require string input. Use featureClassifier with an explicit numeric encoder.",
    );
  }
  const strings = (rows: readonly DatasetExample<unknown, unknown>[]) =>
    rows.map((row) => {
      if (typeof row.input !== "string") {
        throw new Error("Expected string training input.");
      }
      return { ...row, input: row.input };
    });
  return {
    ...project,
    task: project.task as ParserDefinition<z.ZodType>,
    train: strings(project.train),
    validation: strings(project.validation),
    evaluation: strings(project.evaluation),
  };
}
