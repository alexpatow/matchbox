import type { ParserDefinition } from "@matchbox-ai/core";
import type { z } from "zod";
import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { createParser } from "@matchbox-ai/core/runtime";
import task from "../tests/fixtures/field-classifier/matchbox/money/parser.js";
import sequenceTask from "../examples/money/matchbox/money/parser.js";
import decode from "../examples/money/matchbox/money/decode/decode.js";

for (const kind of ["record", "sequence"] as const) {
  test(`Model execution returns correct accepted outputs on ${kind} regression examples and handles disposal`, async () => {
    const artifact = JSON.parse(
      await readFile(
        `${kind === "record" ? "tests/fixtures/field-classifier" : "examples/money"}/.matchbox/money/model.matchbox`,
        "utf8",
      ),
    );
    const selectedTask: ParserDefinition<z.ZodType> = kind === "record" ? task : sequenceTask;
    const decoder = kind === "record" ? undefined : decode;
    const parser = createParser(artifact, selectedTask, decoder);
    const rows = (
      await readFile(
        `${kind === "record" ? "tests/fixtures/field-classifier" : "examples/money"}/matchbox/money/evals/test.jsonl`,
        "utf8",
      )
    )
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { input: string; output: unknown });
    try {
      let accepted = 0;
      for (const row of rows) {
        const actual = await parser.parse(row.input);
        if (actual.status === "ok") {
          accepted++;
          expect(actual.value).toEqual(row.output);
        } else {
          expect(actual.value).toBeNull();
        }
      }
      expect(accepted / rows.length).toBeGreaterThanOrEqual(0.9);
      await Promise.all(Array.from({ length: 30 }, () => parser.parse(rows[0]!.input)));
      expect(await parser.parse("eleven unfamiliar widgets")).toMatchObject({
        status: "uncertain",
        value: null,
      });
      parser.dispose();
      parser.dispose();
      await expect(parser.parse(rows[0]!.input)).rejects.toThrow("disposed");
      const early = createParser(artifact, selectedTask, decoder);
      const pending = early.parse(rows[0]!.input);
      early.dispose();
      await expect(pending).rejects.toThrow("disposed");
    } finally {
      parser.dispose();
    }
  });
}
