import type { Token } from "./types.js";
export function tokenize(input: string, mode: "characters" | "words"): Token[] {
  const pattern = mode === "characters" ? /[\s\S]/gu : /[+-]?\d+(?:[.,]\d+)*|[\p{L}]+|[^\s]/gu;
  return [...input.matchAll(pattern)].map((match) => ({
    text: match[0],
    key: mode === "words" && /^[+-]?\d/.test(match[0]) ? "<number>" : match[0].toLowerCase(),
    start: match.index,
    end: match.index + match[0].length,
  }));
}
export function windows(tokens: readonly Token[], vocabulary: readonly string[], radius: number) {
  const ids = new Map(vocabulary.map((word, index) => [word, index + 2]));
  return tokens.map((_, position) =>
    Array.from({ length: radius * 2 + 1 }, (_, offset) => {
      const token = tokens[position + offset - radius];
      return token ? (ids.get(token.key) ?? 1) : 0;
    }),
  );
}
