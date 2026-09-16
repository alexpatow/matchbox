import { tensorPredictor } from "@matchbox-ai/core/internal";

export async function benchmark() {
  const model = await fetch("/research-model").then((response) => response.json());
  const inputs: string[] = await fetch("/research-inputs").then((response) => response.json());
  const start = performance.now();
  const predictor = await tensorPredictor(model);
  const initializationMs = performance.now() - start;
  try {
    const timings = inputs.map((input) => {
      for (let index = 0; index < 5; index++) {
        predictor.sequence(input);
      }
      const samplesMs = Array.from({ length: 30 }, () => {
        const before = performance.now();
        predictor.sequence(input);
        return performance.now() - before;
      }).sort((left, right) => left - right);
      return {
        utf16Units: input.length,
        codePoints: [...input].length,
        samplesMs,
        p50Ms: samplesMs[14],
        p95Ms: samplesMs[28],
      };
    });
    return { initializationMs, timings };
  } finally {
    predictor.dispose();
  }
}
