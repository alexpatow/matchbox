import type { ValidationIssue } from "./types.js";

/** Reject values JSON would silently alter, omit, or invoke custom serialization on. */
export function jsonIssue(
  value: unknown,
  path: readonly (string | number)[] = [],
  ancestors = new Set<object>(),
): ValidationIssue | undefined {
  const fail = (message: string): ValidationIssue => ({ code: "invalid_json", path, message });
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number")
    return Number.isFinite(value) ? undefined : fail("Expected a finite JSON number.");
  if (typeof value !== "object") return fail("Expected a JSON value.");
  if (ancestors.has(value)) return fail("Circular values are not JSON.");
  if (ancestors.size >= 64) return fail("JSON nesting exceeds 64 levels.");
  const array = Array.isArray(value);
  if (
    !array &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  ) {
    return fail("Expected a plain JSON object.");
  }
  const next = new Set(ancestors).add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (array && Object.keys(value).length !== value.length)
    return fail("Expected a dense JSON array without extra properties.");
  for (const key of Reflect.ownKeys(descriptors)) {
    if (array && key === "length") continue;
    if (typeof key !== "string") return fail("Symbol properties are not JSON.");
    if (key === "__proto__") return fail("__proto__ is a reserved property name.");
    if (
      array &&
      (!Number.isInteger(Number(key)) ||
        Number(key) < 0 ||
        Number(key) >= value.length ||
        String(Number(key)) !== key)
    ) {
      return fail("Array properties must be consecutive indices.");
    }
    const descriptor = descriptors[key];
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      return fail("JSON properties must be enumerable values, not accessors.");
    }
    const issue = jsonIssue(descriptor.value, [...path, array ? Number(key) : key], next);
    if (issue) return issue;
  }
}
