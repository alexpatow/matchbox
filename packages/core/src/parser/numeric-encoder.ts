/** Application-owned, deterministic features shared by training and inference. No fitted state. */
export interface NumericEncoder<Input> {
  readonly size: number;
  encode(input: Input): readonly number[];
}
