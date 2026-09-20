import { RecordPredictor } from "../../../wasm/matchbox_wasm.js";
import { initialize } from "./initialize.js";
import type { FeatureArtifact } from "../../internal/features/artifact.js";
export async function featurePredictor(model: FeatureArtifact) {
  await initialize();
  const config = {
    vocabularySize: model.inputSize,
    fields: model.fields.map((field) => field.values.length),
  };
  const bytes = Uint8Array.from(atob(model.weights), (character) => character.charCodeAt(0));
  const predictor = new RecordPredictor(JSON.stringify(config), bytes);
  let disposed = false;
  return {
    predict(features: readonly number[]) {
      if (disposed) {
        throw new Error("The parser has been disposed.");
      }
      const probabilities = predictor.predict(Float32Array.from(features));
      let offset = 0;
      const fields = model.fields.map((field) => {
        const scores = probabilities.subarray(offset, offset + field.values.length);
        offset += field.values.length;
        const confidence = Math.max(...scores);
        return { field: field.name, value: field.values[scores.indexOf(confidence)], confidence };
      });
      return {
        value: Object.fromEntries(fields.map((field) => [field.field, field.value])),
        confidence: Math.min(...fields.map((field) => field.confidence)),
        probabilities: Array.from(probabilities),
      };
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        predictor.free();
      }
    },
  };
}
