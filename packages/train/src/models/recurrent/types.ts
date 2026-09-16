export interface TextParts {
  readonly kind: "text-parts";
  readonly version: 1;
}
export interface TextFeatures {
  readonly kind: "text-features";
  readonly version: 1;
}
export interface SpanLabels {
  readonly kind: "span-labels";
  readonly whitespace: "context" | "supervise";
}
export interface RecurrentRecipe {
  tokenizer: TextParts;
  features: TextFeatures;
  labels: readonly string[];
  annotate: SpanLabels;
}
