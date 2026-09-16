import { Predictor } from "../../../wasm/matchbox_webgpu.js";
import { loadWebGpu } from "./load-webgpu.js";
import { splitParts, encodeParts, featureCount } from "../../internal/recurrent/index.js";
import type { RecurrentArtifact } from "../../internal/recurrent/index.js";

export async function gpuPredictor(model: RecurrentArtifact) {
  await loadWebGpu();
  const bytes = Uint8Array.from(atob(model.weights), (character) => character.charCodeAt(0));
  const predictor = Predictor.load(
    JSON.stringify({ featureCount, labelCount: model.labels.length, maxParts: model.maxParts }),
    bytes,
  );
  let disposed = false;
  let pending: Promise<unknown> = Promise.resolve();
  return {
    sequence(input: string) {
      const result = pending.then(async () => {
        if (disposed) {
          throw new Error("The parser has been disposed.");
        }
        const tokens = splitParts(input);
        if (input.length > model.maxInputLength || tokens.length > model.maxParts) {
          throw new Error("Input exceeds the recurrent model limits.");
        }
        if (!tokens.length) {
          return [];
        }
        const scores = await predictor.predict(encodeParts(tokens));
        if (disposed) {
          throw new Error("The parser has been disposed.");
        }
        return tokens.map((token, index) => {
          const row = scores.subarray(
            index * model.labels.length,
            (index + 1) * model.labels.length,
          );
          const confidence = Math.max(...row);
          return { ...token, label: model.labels[row.indexOf(confidence)]!, confidence };
        });
      });
      pending = result.catch(() => {});
      return result;
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      void pending.then(() => predictor.free());
    },
  };
}
