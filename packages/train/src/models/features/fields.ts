import type { DatasetExample, ParserMetadata } from "@matchbox-ai/core";
export function outputFields(
  examples: readonly DatasetExample<unknown, unknown>[],
  metadata: ParserMetadata,
) {
  const schema = metadata.output;
  if (schema.type !== "object" || !schema.properties || schema.additionalProperties !== false) {
    throw new Error(
      "Feature classification requires a strict flat output object with primitive field values.",
    );
  }
  const fields = Object.keys(schema.properties).map((name) => {
    const values = [
      ...new Map(
        examples.map((row) => {
          const value = (row.output as Record<string, unknown>)[name];
          if (value !== null && !["number", "string", "boolean"].includes(typeof value)) {
            throw new Error(
              `output.${name}: feature classification requires primitive field values.`,
            );
          }
          return [JSON.stringify(value), value as string | number | boolean | null] as const;
        }),
      ).entries(),
    ]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);
    return { name, values };
  });
  return fields;
}
