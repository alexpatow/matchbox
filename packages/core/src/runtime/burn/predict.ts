import { Predictor } from "../../../wasm/matchbox_wasm.js";
import { initialize } from "./initialize.js";
import { tokenize, windows } from "../../internal/sequence/index.js";
import type { SequenceArtifact } from "../../internal/sequence/index.js";
export async function burnPredictor(model: SequenceArtifact) {
  await initialize();
  const config = {
    vocabularySize: model.vocabulary.length + 2,
    labelCount: model.labels.length,
    contextRadius: model.radius,
  };
  const bytes = Uint8Array.from(atob(model.weights), (character) => character.charCodeAt(0));
  const predictor = new Predictor(JSON.stringify(config), bytes);
  let disposed = false;
  return {
    sequence(input: string) {
      if (disposed) {
        throw new Error("The parser has been disposed.");
      }
      const tokens = tokenize(input, model.tokenizer, model.casing);
      if (!tokens.length) {
        return [];
      }
      const scores = predictor.predict(
        Int32Array.from(windows(tokens, model.vocabulary, model.radius).flat()),
      );
      return tokens.map((token, index) => {
        const row = scores.subarray(index * model.labels.length, (index + 1) * model.labels.length);
        const confidence = Math.max(...row);
        return { ...token, label: model.labels[row.indexOf(confidence)]!, confidence };
      });
    },
    record(_input: string): never {
      throw new Error("A sequence model cannot predict record fields.");
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        predictor.free();
      }
    },
  };
}
