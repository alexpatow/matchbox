import { verifyExport } from "./verify-export.js";
import { fitNativeRecord } from "../../native/index.js";
import { recordFeatures, recordTokens, readRecordArtifact } from "@matchbox-ai/core/internal";
import type { RecordArtifact } from "@matchbox-ai/core/internal";
import type { DatasetExample, ParserMetadata } from "@matchbox-ai/core";
export async function fitRecord(
  examples: readonly DatasetExample<unknown>[],
  metadata: { taskModule: string; taskMetadata: ParserMetadata },
  probes: readonly string[],
  progress?: (epoch: number, loss: number) => void,
) {
  const schema = metadata.taskMetadata.output;
  if (schema.type !== "object" || !schema.properties || schema.additionalProperties !== false) {
    throw new Error(
      "The default trainer currently supports strict flat objects with primitive field values. Use an explicit sequence pipeline for other shapes.",
    );
  }
  const fields = Object.keys(schema.properties).map((name) => {
    const values = [
      ...new Map(
        examples.map((row) => {
          const value = (row.output as Record<string, unknown>)[name];
          if (value !== null && !["number", "string", "boolean"].includes(typeof value)) {
            throw new Error(`output.${name}: the default trainer requires primitive field values.`);
          }
          return [JSON.stringify(value), value as string | number | boolean | null] as const;
        }),
      ).entries(),
    ]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);
    return { name, values };
  });
  const vocabulary = [...new Set(examples.flatMap((row) => recordTokens(row.input)))].sort();
  if (
    fields.length > 32 ||
    fields.some((field) => field.values.length > 256) ||
    vocabulary.length > 10000
  ) {
    throw new Error(
      "Default trainer capacity exceeded. Use a custom pipeline for larger output domains.",
    );
  }
  const config = {
    vocabularySize: vocabulary.length,
    fields: fields.map((field) => field.values.length),
  };
  const result = await fitNativeRecord(
    config,
    examples.map((row) => recordFeatures(row.input, vocabulary)),
    examples.flatMap((row) =>
      fields.map((field) =>
        field.values.indexOf(
          (row.output as Record<string, string | number | boolean | null>)[field.name]!,
        ),
      ),
    ),
    progress,
  );
  const artifact = (weights: Uint8Array): RecordArtifact =>
    readRecordArtifact({
      formatVersion: 3,
      engine: "burn-0.21",
      kind: "record-parser",
      architecture: "bag-of-words-mlp",
      ...metadata,
      decoderModule: null,
      fields,
      vocabulary,
      threshold: 0.75,
      precision: "float32",
      weights: Buffer.from(weights).toString("base64"),
    });
  const model = artifact(result.weights);
  const parity = await verifyExport(result.weights, model, probes);
  return {
    model,
    parameters: result.parameters,
    history: result.loss,
    parity,
  };
}
