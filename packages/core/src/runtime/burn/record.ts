import { RecordPredictor } from "../../../wasm/matchbox_wasm.js";
import { initialize } from "./initialize.js";
import { recordFeatures } from "../../internal/record/features.js";
import type { RecordArtifact } from "../../internal/record/artifact.js";
export async function recordPredictor(model: RecordArtifact) {
  await initialize();
  const config = {
    vocabularySize: model.vocabulary.length,
    fields: model.fields.map((field) => field.values.length),
  };
  const bytes = Uint8Array.from(atob(model.weights), (character) => character.charCodeAt(0));
  const predictor = new RecordPredictor(JSON.stringify(config), bytes);
  let disposed = false;
  return {
    record(input: string) {
      if (disposed) {
        throw new Error("The parser has been disposed.");
      }
      const probabilities = predictor.predict(
        Float32Array.from(recordFeatures(input, model.vocabulary)),
      );
      let offset = 0;
      const fields = model.fields.map((field) => {
        const scores = probabilities.subarray(offset, offset + field.values.length);
        offset += field.values.length;
        const confidence = Math.max(...scores);
        return { field: field.name, value: field.values[scores.indexOf(confidence)], confidence };
      });
      return {
        fields,
        value: Object.fromEntries(fields.map((field) => [field.field, field.value])),
        confidence: Math.min(...fields.map((field) => field.confidence)),
      };
    },
    sequence(_input: string): never {
      throw new Error("A record model cannot predict sequence labels.");
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        predictor.free();
      }
    },
  };
}
