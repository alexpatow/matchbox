import { RecurrentPredictor } from "../../../wasm/matchbox_wasm.js";
import { initialize } from "./initialize.js";
import { splitParts, encodeParts, featureCount } from "../../internal/recurrent/index.js";
import type { RecurrentArtifact } from "../../internal/recurrent/index.js";
export async function recurrentPredictor(model: RecurrentArtifact) {
  await initialize();
  const bytes = Uint8Array.from(atob(model.weights), (character) => character.charCodeAt(0));
  const predictor = new RecurrentPredictor(
    JSON.stringify({ featureCount, labelCount: model.labels.length, maxParts: model.maxParts }),
    bytes,
  );
  let disposed = false;
  return {
    sequence(input: string) {
      if (disposed) {
        throw new Error("The parser has been disposed.");
      }
      if (input.length > model.maxInputLength) {
        throw new Error("Input exceeds the recurrent input limit.");
      }
      const tokens = splitParts(input);
      if (!tokens.length) {
        return [];
      }
      if (tokens.length > model.maxParts) {
        throw new Error("Input exceeds the recurrent part limit.");
      }
      const scores = predictor.predict(encodeParts(tokens));
      return tokens.map((token, index) => {
        const row = scores.subarray(index * model.labels.length, (index + 1) * model.labels.length);
        const confidence = Math.max(...row);
        return { ...token, label: model.labels[row.indexOf(confidence)]!, confidence };
      });
    },
    record(_input: string): never {
      throw new Error("A recurrent model cannot predict record fields.");
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        predictor.free();
      }
    },
  };
}
