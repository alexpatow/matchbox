import type { ParserDefinition } from "@matchbox-ai/core";
import type { z } from "zod";
import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { createParser } from "@matchbox-ai/core/runtime";
import task from "../tests/fixtures/field-classifier/matchbox/money/parser.js";
import sequenceTask from "../examples/money/matchbox/money/parser.js";
import decode from "../examples/money/matchbox/money/decode/decode.js";
import { tensorPredictor } from "../packages/core/src/runtime/tensorflow/index.js";
import * as tf from "@tensorflow/tfjs-core";

for (const kind of ["money-simple", "money-pipeline"] as const) {
  test(`TensorFlow model execution matches gold outputs on ${kind} held-out examples and releases tensors`, async () => {
    const previous = tf.getBackend();
    const artifact = JSON.parse(
      await readFile(
        `${kind === "money-simple" ? "tests/fixtures/field-classifier" : "examples/money"}/.matchbox/money/model.matchbox`,
        "utf8",
      ),
    );
    const selectedTask: ParserDefinition<z.ZodType> = kind === "money-simple" ? task : sequenceTask;
    const decoder = kind === "money-simple" ? undefined : decode;
    const parser = createParser(artifact, selectedTask, decoder);
    const rows = (
      await readFile(
        `${kind === "money-simple" ? "tests/fixtures/field-classifier" : "examples/money"}/matchbox/money/evals/test.jsonl`,
        "utf8",
      )
    )
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { input: string; output: unknown });
    const before = tf.memory().numTensors;
    try {
      for (const row of rows) {
        const actual = await parser.parse(row.input);
        expect(actual.status).toBe("ok");
        expect(actual.value).toEqual(row.output);
      }
      const retained = tf.memory().numTensors;
      await Promise.all(Array.from({ length: 30 }, () => parser.parse(rows[0]!.input)));
      expect(tf.memory().numTensors).toBe(retained);
      expect(await parser.parse("eleven unfamiliar widgets")).toMatchObject({
        status: "uncertain",
        value: null,
        confidence: 0,
      });
      parser.dispose();
      parser.dispose();
      expect(tf.memory().numTensors).toBe(before);
      await expect(parser.parse(rows[0]!.input)).rejects.toThrow("disposed");
      const early = createParser(artifact, selectedTask, decoder);
      const pending = early.parse(rows[0]!.input);
      early.dispose();
      await expect(pending).rejects.toThrow("disposed");
      expect(tf.memory().numTensors).toBe(before);
    } finally {
      parser.dispose();
      if (previous) await tf.setBackend(previous);
    }
  });
}

test("TensorFlow predictor refuses a silently changed backend", async () => {
  const artifact = JSON.parse(
    await readFile("tests/fixtures/field-classifier/.matchbox/money/model.matchbox", "utf8"),
  );
  const previous = tf.getBackend();
  const predictor = await tensorPredictor(artifact);
  const name = "matchbox-test-cpu";
  tf.registerBackend(name, () => tf.findBackend("cpu")!, 0);
  try {
    await tf.setBackend(name);
    expect(() => predictor.record("fifteen euros")).toThrow("backend changed");
  } finally {
    await tf.setBackend("cpu");
    predictor.dispose();
    // The alias shares the CPU backend; leave its lifecycle to TensorFlow.
    if (previous) await tf.setBackend(previous);
  }
});
