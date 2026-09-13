export interface Token {
  text: string;
  key: string;
  start: number;
  end: number;
}
export interface TaggedToken extends Token {
  label: string;
  confidence: number;
}
export type SequenceDecoder = (tokens: readonly TaggedToken[], input: string) => unknown;
export interface WeightMatrix {
  shape: number[];
  values: number[];
  scale: number;
}
