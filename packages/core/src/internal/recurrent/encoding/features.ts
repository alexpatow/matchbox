import type { Token } from "../../sequence/types.js";
import { kind, normalize } from "./characters.js";
// Fixed, versioned categorical namespaces. 659..690 remain reserved for compatibility
// with the measured feature layout. No hand-authored symbol-pair categories are used.
export const featureCount = 756;
function pairHash(left: number, right: number) {
  return 1 + (((Math.imul(left + 1, 131) ^ right) >>> 0) % 31);
}
function shape(code: number) {
  if (code >= 97 && code <= 122) {
    return 1;
  }
  if (code >= 65 && code <= 90) {
    return 2;
  }
  if (code >= 48 && code <= 57) {
    return 4;
  }
  return code === 95 ? 8 : 0;
}
/** Generic shape/spelling/boundary hashes, adapted from gpu-lexer (MIT, Shu Ding). */
export function encodeParts(tokens: readonly Token[]): Int32Array {
  const result = new Int32Array(tokens.length * 16);
  let lineStart = true;
  tokens.forEach((token, index) => {
    const text = token.text;
    const type = kind(text.charCodeAt(0));
    const first = normalize(text.charCodeAt(0));
    const last = normalize(text.charCodeAt(text.length - 1));
    const ids = [type, 4 + Math.min(7, 31 - Math.clz32(text.length)), 12 + first, 140 + last];
    let flags = lineStart ? 16 : 0;
    if (type === 0) {
      let primary = 2166136261;
      let secondary = 0x9e3779b9;
      for (let i = 0; i < text.length; i++) {
        const code = normalize(text.charCodeAt(i));
        primary = Math.imul(primary ^ code, 16777619);
        secondary = Math.imul(secondary ^ code, 2246822519);
        flags |= shape(code);
      }
      ids.push(268 + (primary & 255), 524 + (secondary & 127));
    } else if (type === 1 && text.includes("\t")) {
      flags |= 32;
    } else if (type === 3 && first === 92) {
      flags |= 64;
    }
    for (let bit = 0; bit < 7; bit++) {
      if (flags & (1 << bit)) {
        ids.push(652 + bit);
      }
    }
    const previous = tokens[index - 1]?.text;
    const next = tokens[index + 1]?.text;
    if (previous && (type === 3 || kind(previous.charCodeAt(0)) === 3)) {
      ids.push(691 + pairHash(normalize(previous.charCodeAt(previous.length - 1)), first));
    }
    if (next && (type === 3 || kind(next.charCodeAt(0)) === 3)) {
      ids.push(723 + pairHash(last, normalize(next.charCodeAt(0))));
    }
    result.set(
      ids.map((id) => id + 1),
      index * 16,
    );
    if (type === 2) {
      lineStart = true;
    } else if (type !== 1) {
      lineStart = false;
    }
  });
  return result;
}
