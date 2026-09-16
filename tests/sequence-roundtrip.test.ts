import { expect, test } from "bun:test";
import { z } from "zod";
import { defineParser } from "@matchbox-ai/core";
import { createParser } from "@matchbox-ai/core/runtime";
import { fitSequence } from "../packages/train/src/models/sequence/fit-sequence";
import type { SequenceRecipe } from "@matchbox-ai/train";

test("case-sensitive wider-context weights survive native to WASM packaging", async () => {
  const task = defineParser({
    input: z.string(),
    output: z.strictObject({ label: z.enum(["upper", "lower"]) }),
  });
  const recipe: SequenceRecipe = {
    tokenizer: "characters",
    casing: "preserve",
    readout: "last",
    labels: ["upper", "lower"],
    annotate: (example, tokens) => tokens.map(() => (example.output as { label: string }).label),
  };
  const rows = Array.from({ length: 64 }, (_, index) => ({
    input: index % 2 === 0 ? "A" : "a",
    output: { label: index % 2 === 0 ? "upper" : "lower" },
  }));
  const result = await fitSequence(
    rows,
    recipe,
    {
      taskModule: "./parser.ts",
      decoderModule: "./decode.ts",
      taskMetadata: task.toJSON(),
    },
    ["A", "a"],
    undefined,
    4,
  );
  expect(result.model.radius).toBe(4);
  expect(result.model.casing).toBe("preserve");
  expect(result.model.formatVersion).toBe(4);
  expect(result.parity.labelDisagreements).toBe(0);
  const parser = createParser(JSON.parse(JSON.stringify(result.model)), task, (tokens) => ({
    label: tokens.at(-1)?.label,
  }));
  try {
    expect(await parser.parse("A")).toMatchObject({ status: "ok", value: { label: "upper" } });
    expect(await parser.parse("a")).toMatchObject({ status: "ok", value: { label: "lower" } });
  } finally {
    parser.dispose();
  }
});
