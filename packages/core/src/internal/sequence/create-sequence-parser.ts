import type { z } from "zod";
import type { ParserDefinition } from "../../parser/index.js";
import type { MatchboxParser } from "../../runtime/types.js";
import { readSequenceArtifact } from "./artifact.js";
import type { TaggedToken } from "./types.js";
import type { SequenceDecoder } from "./types.js";
export function createSequenceParser<Output extends z.ZodType>(
  artifact: unknown,
  task: ParserDefinition<Output>,
  decode: SequenceDecoder,
  predictor: (input: string) => TaggedToken[],
): MatchboxParser<z.output<Output>> {
  const model = readSequenceArtifact(artifact);
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
      const tokens = predict(input);
      if (
        !tokens.length ||
        (model.unknownTokens === "abstain" && tokens.some((token) => !vocabulary.has(token.key)))
      ) {
        return uncertain("The model has insufficient training coverage to answer confidently.");
      }
      // Only positions supervised by the recipe contribute to the acceptance score.
      const relevant = model.readout === "last" ? tokens.slice(-1) : tokens;
      const confidence = Math.min(...relevant.map((token) => token.confidence));
      if (confidence < model.threshold) {
        return uncertain("Recognition confidence is too low.", confidence);
      }
      const candidate = decode(tokens, input);
      if (candidate == null) {
        return uncertain("The recognized expression is ambiguous or unsupported.", confidence);
      }
      const result = task.validateOutput(candidate);
      return result.success
        ? { status: "ok", value: result.data, confidence }
        : uncertain("The decoded output failed schema validation.", confidence);
    },
  };
}
