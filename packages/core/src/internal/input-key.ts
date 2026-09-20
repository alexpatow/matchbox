/** Stable JSON identity for overlap checks; text keeps the existing case-insensitive policy. */
export function inputKey(value: unknown): string {
  if (typeof value === "string") {
    return value.trim().toLowerCase();
  }
  const canonical = (input: unknown): unknown => {
    if (Array.isArray(input)) {
      return input.map(canonical);
    }
    if (input !== null && typeof input === "object") {
      return Object.fromEntries(
        Object.entries(input)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, item]) => [key, canonical(item)]),
      );
    }
    return input;
  };
  return JSON.stringify(canonical(value));
}
