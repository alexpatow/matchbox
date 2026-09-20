import type { MatchboxParser, ParseResult } from "@matchbox-ai/core/runtime";
import type { InferOutput } from "@matchbox-ai/core";
import type parser from "./parser";
import type { Stroke } from "./parser";
import type { Shape } from "./geometry/shape";
import { fitShape } from "./geometry/fit";
/** Recognition is learned; fitting and the decision to retain the original stroke are application-owned. */
export async function recognize(
  model: MatchboxParser<InferOutput<typeof parser>, Stroke>,
  stroke: Stroke,
): Promise<ParseResult<Shape>> {
  const prediction = await model.parse(stroke);
  if (prediction.status === "uncertain") {
    return prediction;
  }
  if (prediction.value.kind === "unknown") {
    return {
      status: "uncertain",
      value: null,
      confidence: prediction.confidence,
      reason: "No supported shape recognized. Original stroke kept.",
    };
  }
  const fit = fitShape(stroke.points, prediction.value.kind);
  if (!fit) {
    return {
      status: "uncertain",
      value: null,
      confidence: prediction.confidence,
      reason: "The stroke does not closely fit the predicted shape. Original stroke kept.",
    };
  }
  return { status: "ok", value: fit.shape, confidence: prediction.confidence };
}
