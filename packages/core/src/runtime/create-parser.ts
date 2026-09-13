import type { z } from "zod";
import type { ParserDefinition } from "../parser/index.js";
import { readArtifact } from "./artifact.js";
import { compileClauses } from "./compile.js";
import { recognize } from "./recognize.js";
import type { MatchboxParser } from "./types.js";
export function createParser<Output extends z.ZodType>(
  artifact: unknown,
  task: ParserDefinition<Output>,
): MatchboxParser<z.output<Output>> {
  const model = readArtifact(artifact);
  if (JSON.stringify(model.taskMetadata) !== JSON.stringify(task.toJSON()))
    throw new Error("The model and task schema differ. Retrain the model.");
  return {
    async parse(input) {
      if (!task.validateInput(input).success)
        return {
          status: "uncertain",
          value: null,
          confidence: 0,
          reason: "Input does not satisfy the task schema.",
        };
      const candidate = compileClauses(input, (clause) => recognize(model, clause));
      if (!candidate.value)
        return {
          status: "uncertain",
          value: null,
          confidence: candidate.confidence,
          reason: "This query needs a clearer supported filter clause.",
        };
      const result = task.validateOutput(candidate.value);
      if (!result.success)
        return {
          status: "uncertain",
          value: null,
          confidence: candidate.confidence,
          reason: "The predicted filter failed schema validation.",
        };
      return { status: "ok", value: result.data, confidence: candidate.confidence };
    },
  };
}
