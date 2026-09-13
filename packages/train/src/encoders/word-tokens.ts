/** Literal word tokens. Unseen vocabulary causes abstention. */
export function wordTokens() {
  return { kind: "words" } as const;
}
