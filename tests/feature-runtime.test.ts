import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { createParser } from "@matchbox-ai/core/runtime";
import task from "../examples/sketch/matchbox/shapes/parser";
import encoder from "../examples/sketch/matchbox/shapes/encode";
import { samples } from "../apps/playground/src/sketch/samples";
const artifact = JSON.parse(
  await readFile(
    new URL("../examples/sketch/.matchbox/shapes/model.matchbox", import.meta.url),
    "utf8",
  ),
);
test("numeric runtime shares initialization and rejects parsing after disposal", async () => {
  const parser = createParser(artifact, task, encoder);
  const results = await Promise.all(
    Array.from({ length: 20 }, () => parser.parse({ points: samples.ellipse })),
  );
  expect(results.every((result) => result.status === "ok" && result.value.kind === "ellipse")).toBe(
    true,
  );
  parser.dispose();
  parser.dispose();
  await expect(parser.parse({ points: samples.ellipse })).rejects.toThrow(/disposed/);
  const early = createParser(artifact, task, encoder);
  const loading = early.load();
  early.dispose();
  await expect(loading).rejects.toThrow(/disposed/);
});
test("invalid numeric encoders fail as authoring errors rather than uncertainty", async () => {
  const parser = createParser(artifact, task, { size: 66, encode: () => [NaN] });
  await expect(parser.parse({ points: samples.ellipse })).rejects.toThrow(/features/);
  parser.dispose();
  expect(() => createParser({ ...artifact, taskMetadata: {} }, task, encoder)).toThrow(
    /schema differ/,
  );
});
