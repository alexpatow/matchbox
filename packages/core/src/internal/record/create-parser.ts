import type { z } from "zod";
import type { ParserDefinition } from "../../parser/index.js";
import type { MatchboxParser } from "../../runtime/types.js";
import { readRecordArtifact } from "./artifact.js";
import { recordTokens } from "./features.js";
import type { recordPredictor as tensorPredictor } from "../../runtime/burn/record.js";
export function createRecordParser<Output extends z.ZodType>(
  artifact: unknown,
  task: ParserDefinition<Output>,
  predictor: Awaited<ReturnType<typeof tensorPredictor>>["record"],
): MatchboxParser<z.output<Output>> {
  const model = readRecordArtifact(artifact);
  if (JSON.stringify(model.taskMetadata) !== JSON.stringify(task.toJSON())) {
    throw new Error("The model and task schema differ. Retrain the model.");
  }
  const predict = predictor;
  const vocabulary = new Set(model.vocabulary);
  return {
    async parse(input) {
      const uncertain = (reason: string, confidence = 0) => ({
        status: "uncertain" as const,
        value: null,
        confidence,
        reason,
      });
      if (!task.validateInput(input).success || input.length > 512) {
        return uncertain("Input does not satisfy the supported input limits.");
      }
      const tokens = recordTokens(input);
      if (!tokens.length || tokens.some((token) => !vocabulary.has(token))) {
        return uncertain("The model has insufficient training coverage to answer confidently.");
      }
      const result = predict(input);
      if (result.confidence < model.threshold) {
        return uncertain("Recognition confidence is too low.", result.confidence);
      }
      const checked = task.validateOutput(result.value);
      return checked.success
        ? { status: "ok", value: checked.data, confidence: result.confidence }
        : uncertain("The predicted output failed schema validation.", result.confidence);
    },
  };
}
