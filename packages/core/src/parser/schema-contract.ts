import { z } from "zod";
import { checkConstraints } from "./schema-checks.js";

/** A deliberately small Zod subset. Unsupported behavior must never disappear in metadata. */
export function checkSchema(
  schema: z.core.$ZodType,
  path: string,
  ancestors = new Set<z.core.$ZodType>(),
  optionalProperty = false,
): void {
  if (!schema?._zod) {
    throw new TypeError(`${path}: expected a Zod 4 schema.`);
  }
  if (ancestors.has(schema)) {
    throw new TypeError(`${path}: recursive schemas are not supported yet.`);
  }
  if (ancestors.size >= 64) {
    throw new TypeError(`${path}: schema nesting exceeds 64 levels.`);
  }
  checkConstraints(schema, path);
  const def = (schema as z.core.$ZodTypes)._zod.def;
  const next = new Set(ancestors).add(schema);
  const visit = (child: z.core.$ZodType, key: string, optional = false) =>
    checkSchema(child, `${path}.${key}`, next, optional);
  switch (def.type) {
    case "string":
    case "number":
    case "boolean":
    case "null":
      return;
    case "enum":
      if (
        Object.values(def.entries).some(
          (value) => typeof value === "number" && !Number.isFinite(value),
        )
      ) {
        throw new TypeError(`${path}: enum values must be finite JSON values.`);
      }
      return;
    case "literal":
      if (
        def.values.some(
          (value) =>
            value !== null &&
            !["string", "boolean"].includes(typeof value) &&
            !(typeof value === "number" && Number.isFinite(value)),
        )
      ) {
        throw new TypeError(`${path}: literals must contain finite JSON values.`);
      }
      return;
    case "object":
      if (def.catchall?._zod.def.type !== "never") {
        throw new TypeError(
          `${path}: use z.strictObject() so unknown keys are rejected, not stripped.`,
        );
      }
      for (const [key, child] of Object.entries(def.shape)) {
        if (key === "__proto__") {
          throw new TypeError(`${path}: __proto__ is a reserved property name.`);
        }
        visit(child, key, true);
      }
      return;
    case "array":
      visit(def.element, "items");
      return;
    case "union":
      def.options.forEach((child, index) => visit(child, `options[${index}]`));
      return;
    case "nullable":
      visit(def.innerType, "nullable");
      return;
    case "default":
      if (!optionalProperty || def.innerType._zod.def.type !== "boolean") {
        throw new TypeError(`${path}: defaults currently support boolean object properties.`);
      }
      visit(def.innerType, "default");
      return;
    case "optional":
      if (!optionalProperty) {
        throw new TypeError(`${path}: optional is only supported directly on object properties.`);
      }
      visit(def.innerType, "optional");
      return;
    default:
      throw new TypeError(
        `${path}: schema type '${def.type}' is not supported in parser metadata.`,
      );
  }
}

export function checkStructuredRoot(schema: z.core.$ZodType, path = "output"): void {
  const def = (schema as z.core.$ZodTypes)._zod.def;
  if (def.type === "object" || def.type === "array") {
    return;
  }
  if (def.type === "union") {
    def.options.forEach((child, index) => checkStructuredRoot(child, `${path}.options[${index}]`));
    return;
  }
  throw new TypeError(`${path}: output must be an object, array, or union of structured outputs.`);
}

export function schemaMetadata(schema: z.ZodType): z.core.JSONSchema.BaseSchema {
  const result = z.toJSONSchema(schema, {
    target: "draft-2020-12",
    cycles: "throw",
    unrepresentable: "throw",
    // User metadata must not override validation keywords or inject functions into the artifact.
    metadata: z.registry(),
  });
  return result;
}
