import type { NumericEncoder } from "../../parser/numeric-encoder.js";
export function encodeFeatures<Input>(
  encoder: NumericEncoder<Input>,
  input: Input,
  size = encoder.size,
): number[] {
  if (!Number.isInteger(size) || size < 1 || size > 10000 || encoder.size !== size) {
    throw new Error(
      "Numeric encoder dimensions do not match the model. Retrain after changing the encoder.",
    );
  }
  const values = Array.from(encoder.encode(input));
  if (
    values.length !== size ||
    values.some((value) => !Number.isFinite(value) || !Number.isFinite(Math.fround(value)))
  ) {
    throw new Error(`Numeric encoder must return exactly ${size} finite float32 features.`);
  }
  return values;
}
