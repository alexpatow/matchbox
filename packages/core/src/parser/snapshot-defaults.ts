import { z } from "zod";
/** Resolve defaults once so runtime validation agrees with packaged metadata. */
export function snapshotDefaults<Output extends z.ZodType>(schema: Output): Output {
  const def = schema._zod.def as z.core.$ZodTypes["_zod"]["def"];
  let next: z.core.$ZodTypes["_zod"]["def"];
  switch (def.type) {
    case "default": {
      const { defaultValue, ...rest } = def;
      next = { ...rest, defaultValue };
      break;
    }
    case "object":
      next = {
        ...def,
        shape: Object.fromEntries(
          Object.entries(def.shape).map(([name, child]) => [
            name,
            snapshotDefaults(child as z.ZodType),
          ]),
        ),
      };
      break;
    case "array":
      next = { ...def, element: snapshotDefaults(def.element as z.ZodType) };
      break;
    case "union":
      next = { ...def, options: def.options.map((child) => snapshotDefaults(child as z.ZodType)) };
      break;
    case "optional":
    case "nullable":
      next = { ...def, innerType: snapshotDefaults(def.innerType as z.ZodType) };
      break;
    default:
      return schema;
  }
  const copy = schema.clone(next);
  const metadata = z.globalRegistry.get(schema);
  if (metadata) z.globalRegistry.add(copy, metadata);
  return copy;
}
