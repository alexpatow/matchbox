import type { z } from "zod";
import type { ParserDefinition } from "../../parser/index.js";
import type { SequenceDecoder, TaggedToken } from "../sequence/types.js";
import type { ParseResult } from "../../runtime/types.js";
import type {
  PartialMatchboxParser,
  PartialParseOptions,
  PartialParseResult,
  UncertainRange,
} from "../../runtime/partial.js";
import type { RecurrentArtifact } from "./artifact.js";
import { splitParts } from "./encoding/index.js";
export function createRecurrentParser<Output extends z.ZodType>(
  model: RecurrentArtifact,
  task: ParserDefinition<Output>,
  decode: SequenceDecoder,
  predict: (input: string) => TaggedToken[],
): PartialMatchboxParser<z.output<Output>> {
  type Value = z.output<Output>;
  const uncertain = (reason: string, confidence = 0): ParseResult<Value> => ({
    status: "uncertain",
    value: null,
    confidence,
    reason,
  });
  function parse(input: string): Promise<ParseResult<Value>>;
  function parse(input: string, options: PartialParseOptions): Promise<PartialParseResult<Value>>;
  async function parse(
    input: string,
    options?: PartialParseOptions,
  ): Promise<PartialParseResult<Value>> {
    if (!task.validateInput(input).success || input.length > model.maxInputLength) {
      return uncertain("Input exceeds the model's supported input limits.");
    }
    const parts = splitParts(input);
    if (!parts.length || parts.length > model.maxParts) {
      return uncertain("Input exceeds the model's supported sequence limits or is empty.");
    }
    const tokens = predict(input);
    const relevant = tokens.filter((token) => model.supervision === "all" || token.text.trim());
    if (!relevant.length) {
      return uncertain("There are no supervised positions to recognize.");
    }
    let confidence = 1;
    let confident = 0;
    const uncertainRanges: UncertainRange[] = [];
    for (const token of relevant) {
      confidence = Math.min(confidence, token.confidence);
      if (token.confidence >= model.threshold) {
        confident++;
        continue;
      }
      const last = uncertainRanges.at(-1);
      if (last?.end === token.start) {
        last.end = token.end;
        last.confidence = Math.min(last.confidence, token.confidence);
      } else {
        uncertainRanges.push({ start: token.start, end: token.end, confidence: token.confidence });
      }
    }
    if (uncertainRanges.length && (!options?.allowPartial || !confident)) {
      return uncertain("Recognition confidence is too low.", confidence);
    }
    const candidate = decode(tokens, input);
    if (candidate == null) {
      return uncertain("The recognized expression is ambiguous or unsupported.", confidence);
    }
    const validated = task.validateOutput(candidate);
    if (!validated.success) {
      return uncertain("The decoded output failed schema validation.", confidence);
    }
    if (uncertainRanges.length) {
      return { status: "partial", value: validated.data, confidence, uncertainRanges };
    }
    return { status: "ok", value: validated.data, confidence };
  }
  return { supportsPartial: true, parse };
}
