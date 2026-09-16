/** Independent field classification over training values. Numeric outputs are finite classes. */
export function fieldClassifier() {
  return { kind: "field-classifier" } as const;
}
/** Application-owned span supervision and deterministic decoding. Paths are relative to the task directory. */
export function tokenClassifier(
  options: { recipe?: string; decode?: string; contextRadius?: number } = {},
) {
  return { kind: "token-classifier", recipe: "./recipe", decode: "./decode", ...options } as const;
}
/** Whole-sequence bidirectional state, explicit part features and span supervision. */
export function recurrentTokenClassifier(
  options: {
    recipe?: string;
    decode?: string;
    epochs?: number;
    learningRate?: number;
    batchParts?: number;
    maxInputLength?: number;
    maxParts?: number;
  } = {},
) {
  return {
    kind: "recurrent-token-classifier",
    recipe: "./recipe",
    decode: "./decode",
    ...options,
  } as const;
}
