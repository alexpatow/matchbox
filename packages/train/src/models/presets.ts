/** Independent field classification over training values. Numeric outputs are finite classes. */
export function fieldClassifier() {
  return { kind: "field-classifier" } as const;
}
/** Application-owned span supervision and deterministic decoding. Paths are relative to pipeline.ts. */
export function tokenClassifier(options: { recipe: string; decode: string }) {
  return { kind: "token-classifier", ...options } as const;
}
