import type { z } from "zod";

const supported = new Set([
  "less_than",
  "greater_than",
  "min_length",
  "max_length",
  "length_equals",
]);

/** Zod Core introspection is isolated here and in schema-contract.ts. */
export function checkConstraints(schema: z.core.$ZodType, path: string): void {
  const def = schema._zod.def;
  // Derive the native guard from the consumer's Zod instance; linked packages can have separate copies.
  const nativeLengthGuard =
    (def.type === "string" || def.type === "array") &&
    "min" in schema &&
    typeof schema.min === "function"
      ? (schema as z.ZodString).min(0)._zod.def.checks?.at(-1)?._zod.def.when
      : undefined;
  if ("coerce" in def && def.coerce) {
    throw new TypeError(`${path}: coercion cannot be serialized. Use an explicit input type.`);
  }
  const checks = [...(def.checks ?? [])];
  // Some built-in formats are both a schema and a check.
  const definitions = [def, ...checks.map((check) => check._zod.def)];
  for (const check of definitions) {
    if (!("check" in check)) continue;
    if ("when" in check && check.when && check.when !== nativeLengthGuard) {
      throw new TypeError(`${path}: conditional checks cannot be serialized.`);
    }
    if (supported.has(check.check)) {
      for (const key of ["value", "minimum", "maximum", "length"] as const) {
        if (!(key in check)) continue;
        const bound: unknown = Reflect.get(check, key);
        if (typeof bound !== "number" || !Number.isFinite(bound)) {
          throw new TypeError(`${path}: constraint bounds must be finite.`);
        }
        if (key !== "value" && (!Number.isInteger(bound) || bound < 0)) {
          throw new TypeError(`${path}: length bounds must be nonnegative integers.`);
        }
      }
      continue;
    }
    if (check.check === "number_format" && "format" in check && check.format === "safeint")
      continue;
    if (
      check.check === "string_format" &&
      "format" in check &&
      check.format === "regex" &&
      "pattern" in check &&
      check.pattern instanceof RegExp &&
      check.pattern.flags === ""
    )
      continue;
    throw new TypeError(
      `${path}: unsupported check '${check.check}'. Use serializable built-in constraints.`,
    );
  }
}
