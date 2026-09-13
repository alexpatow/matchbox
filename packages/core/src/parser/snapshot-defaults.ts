import { z } from "zod";
/** Resolve defaults once so runtime validation agrees with packaged metadata. */
export function snapshotDefaults<Output extends z.ZodType>(schema: Output): Output {
  let copy: z.ZodType = schema;
  if (schema instanceof z.ZodDefault) {
    copy = schema.clone({ ...schema._zod.def, defaultValue: schema._zod.def.defaultValue });
  } else if (schema instanceof z.ZodObject) {
    const shape = Object.fromEntries(
      Object.entries(schema.shape).map(([name, child]) => [
        name,
        snapshotDefaults(child as z.ZodType),
      ]),
    );
    copy = schema.clone({ ...schema._zod.def, shape });
  } else if (schema instanceof z.ZodArray) {
    copy = schema.clone({
      ...schema._zod.def,
      element: snapshotDefaults(schema.element as z.ZodType),
    });
  } else if (schema instanceof z.ZodUnion) {
    copy = schema.clone({
      ...schema._zod.def,
      options: schema.options.map((child) => snapshotDefaults(child as z.ZodType)),
    });
  } else if (schema instanceof z.ZodOptional) {
    copy = schema.clone({
      ...schema._zod.def,
      innerType: snapshotDefaults(schema.unwrap() as z.ZodType),
    });
  }
  if (schema instanceof z.ZodNullable) {
    copy = schema.clone({
      ...schema._zod.def,
      innerType: snapshotDefaults(schema.unwrap() as z.ZodType),
    });
  }
  const metadata = z.globalRegistry.get(schema);
  if (copy !== schema && metadata) z.globalRegistry.add(copy, metadata);
  return copy as Output;
}
