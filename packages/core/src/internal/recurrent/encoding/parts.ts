import type { Token } from "../../sequence/types.js";
import { kind, isSpace, isWord } from "./characters.js";
/** Offset-preserving word/space/newline/symbol runs. Adapted from gpu-lexer, MIT, Shu Ding. */
export function splitParts(input: string): Token[] {
  const tokens: Token[] = [];
  let offset = 0;
  while (offset < input.length) {
    const start = offset;
    const first = input.charCodeAt(offset++);
    const type = kind(first);
    if (type === 0) {
      while (offset < input.length && isWord(input.charCodeAt(offset))) {
        offset++;
      }
    } else if (type === 1) {
      while (offset < input.length && isSpace(input.charCodeAt(offset))) {
        offset++;
      }
    } else if (first === 13 && input.charCodeAt(offset) === 10) {
      offset++;
    }
    const text = input.slice(start, offset);
    tokens.push({ text, key: text, start, end: offset });
  }
  return tokens;
}
