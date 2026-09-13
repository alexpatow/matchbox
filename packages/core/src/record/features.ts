/** Literal tokens retain numbers; there are no dictionaries or domain-specific features. */
export function recordTokens(input: string): string[] {
  return input.toLowerCase().match(/[\p{L}\p{N}]+(?:[.,][0-9]+)*|[^\s\p{L}\p{N}]/gu) ?? [];
}
export function recordFeatures(input: string, vocabulary: readonly string[]): number[] {
  const tokens = new Set(recordTokens(input));
  return vocabulary.map((token) => (tokens.has(token) ? 1 : 0));
}
