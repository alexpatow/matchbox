import type { TextParts, TextFeatures, SpanLabels } from "./types.js";
/** Splits words, horizontal whitespace, newlines and symbols while retaining UTF-16 offsets. */
export function textParts(): TextParts {
  return { kind: "text-parts", version: 1 };
}
/** Versioned categorical length, shape, spelling-hash and neighboring-symbol features. */
export function textFeatures(): TextFeatures {
  return { kind: "text-features", version: 1 };
}
/** Supervision from ordered {type,start,end} output spans; preserves mixed-label parts. */
export function spanLabels(options: { whitespace: "context" | "supervise" }): SpanLabels {
  return { kind: "span-labels", ...options };
}
