import type { Token } from "./types.js";
export function tokenize(
  input: string,
  mode: "characters" | "words",
  casing: "lowercase" | "preserve" = "lowercase",
): Token[] {
  const pattern = mode === "characters" ? /[\s\S]/gu : /[+-]?\d+(?:[.,]\d+)*|[\p{L}]+|[^\s]/gu;
  const key = (text: string) => {
    if (mode === "words" && /^[+-]?\d/.test(text)) {
      return "<number>";
    }
    return casing === "preserve" ? text : text.toLowerCase();
  };
  return [...input.matchAll(pattern)].map((match) => ({
    text: match[0],
    key: key(match[0]),
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
