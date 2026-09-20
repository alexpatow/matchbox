import type { z } from "zod";
import type { ParserDefinition } from "../../parser/types.js";
import type { NumericEncoder } from "../../parser/numeric-encoder.js";
import type { MatchboxParser } from "../../runtime/types.js";
import type { FeatureArtifact } from "./artifact.js";
import { encodeFeatures } from "./encode.js";
export function createFeatureParser<Output extends z.ZodType, Input extends z.ZodType>(
  model: FeatureArtifact,
  task: ParserDefinition<Output, Input>,
  encoder: NumericEncoder<z.output<Input>>,
) {
  type Predictor = Awaited<
    ReturnType<(typeof import("../../runtime/burn/features.js"))["featurePredictor"]>
  >;
  let loading: Promise<Predictor> | undefined;
  let active: Predictor | undefined;
  let disposed = false;
  async function load() {
    if (disposed) {
      throw new Error("The parser has been disposed.");
    }
    loading ??= (async () => {
      const { featurePredictor } = await import("../../runtime/burn/features.js");
      const predictor = await featurePredictor(model);
      if (disposed) {
        predictor.dispose();
        throw new Error("The parser has been disposed.");
      }
      active = predictor;
      return predictor;
    })().catch((error: unknown) => {
      loading = undefined;
      throw error;
    });
    return loading;
  }
  const runtime: MatchboxParser<z.output<Output>, z.input<Input>> & {
    load(): Promise<void>;
    dispose(): void;
  } = {
    async load() {
      await load();
    },
    async parse(input) {
      if (disposed) {
        throw new Error("The parser has been disposed.");
      }
      const checked = task.validateInput(input);
      const uncertain = (reason: string, confidence = 0) => ({
        status: "uncertain" as const,
        value: null,
        confidence,
        reason,
      });
      if (!checked.success) {
        return uncertain("Input does not satisfy the task schema.");
      }
      const features = encodeFeatures(encoder, checked.data, model.inputSize);
      const predictor = await load();
      const result = predictor.predict(features);
      if (result.confidence < model.threshold) {
        return uncertain("Recognition confidence is too low.", result.confidence);
      }
      const output = task.validateOutput(result.value);
      return output.success
        ? { status: "ok", value: output.data, confidence: result.confidence }
        : uncertain("The predicted output failed schema validation.", result.confidence);
    },
    dispose() {
      disposed = true;
      active?.dispose();
      active = undefined;
    },
  };
  return runtime;
}
