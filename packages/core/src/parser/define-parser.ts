import { snapshotDefaults } from "./snapshot-defaults.js";
import type { z } from "zod";
import { checkSchema, checkStructuredRoot, schemaMetadata } from "./schema-contract.js";
import { readFields } from "./field-metadata.js";
import type { ParserConfig, ParserDefinition, ParserMetadata } from "./types.js";
import { validate } from "./validation.js";

/** Describe a parser task. This defines validation and training metadata, not inference. */
export function defineParser<Output extends z.ZodType, Input extends z.ZodType = z.ZodString>(
  config: ParserConfig<Output, Input>,
): ParserDefinition<Output, Input> {
  checkSchema(config.input, "input");
  const input = snapshotDefaults(config.input);
  checkSchema(config.output, "output");
  const output = snapshotDefaults(config.output);

  checkStructuredRoot(output);
  const metadata: ParserMetadata = {
    formatVersion: 1,
    kind: "parser",
    input: schemaMetadata(input),
    output: schemaMetadata(output),
    fields: readFields(config.fields),
  };
  // Snapshot once; returned metadata is detached on every call.
  const serialized = JSON.stringify(metadata);
  return Object.freeze({
    kind: "parser" as const,
    input,
    output,
    validateInput: (value: unknown) => validate(input, value),
    validateOutput: (value: unknown) => validate(output, value),
    toJSON: (): ParserMetadata => JSON.parse(serialized) as ParserMetadata,
  });
}
