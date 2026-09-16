/** Mechanical character categories, independent of language or semantic labels. */
export function isSpace(code: number) {
  return code === 9 || code === 11 || code === 12 || code === 32;
}
export function isWord(code: number) {
  return (
    code > 127 ||
    code === 95 ||
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122)
  );
}
export function normalize(code: number) {
  return code > 127 ? 95 : code;
}
export function kind(code: number) {
  if (code === 10 || code === 13) {
    return 2;
  }
  if (isSpace(code)) {
    return 1;
  }
  if (isWord(code)) {
    return 0;
  }
  return 3;
}
