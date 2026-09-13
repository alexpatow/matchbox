export function sameOutput(left: unknown, right: unknown): boolean {
  const canonical = (value: unknown) =>
    JSON.stringify(value, (_key, item: unknown) =>
      item !== null && typeof item === "object" && !Array.isArray(item)
        ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
        : item,
    );
  return canonical(left) === canonical(right);
}
