type Prediction = { label: string; confidence: number };

/** Float32 probability tolerance, independent of the model's acceptance threshold. */
const confidenceTolerance = 1e-4;

export function sequenceParity(threshold: number) {
  let tokens = 0;
  let maxConfidenceError = 0;
  let labelDisagreements = 0;
  let acceptanceDisagreements = 0;
  return {
    add(native: Prediction, portable: Prediction) {
      if (![native.confidence, portable.confidence].every(Number.isFinite)) {
        throw new Error("Burn export parity received non-finite confidence.");
      }
      tokens++;
      maxConfidenceError = Math.max(
        maxConfidenceError,
        Math.abs(native.confidence - portable.confidence),
      );
      if (native.label !== portable.label) {
        labelDisagreements++;
      }
      if (native.confidence >= threshold !== portable.confidence >= threshold) {
        acceptanceDisagreements++;
      }
    },
    report() {
      const report = {
        tokens,
        maxConfidenceError,
        confidenceTolerance,
        labelDisagreements,
        acceptanceDisagreements,
      };
      if (
        labelDisagreements ||
        acceptanceDisagreements ||
        maxConfidenceError > confidenceTolerance
      ) {
        throw new Error(`Burn native and WASM predictions disagree: ${JSON.stringify(report)}`);
      }
      return report;
    },
  };
}
