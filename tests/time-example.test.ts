import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { createParser } from "@matchbox-ai/core/runtime";
import task from "../examples/time/matchbox/time/parser";
import decode from "../examples/time/matchbox/time/decode/decode";
const root = new URL("../examples/time/", import.meta.url);
test("time model passes held-out compositions and abstains on unsupported expressions", async () => {
  const artifact = JSON.parse(
    await readFile(new URL(".matchbox/time/model.matchbox", root), "utf8"),
  );
  const parser = createParser(artifact, task, decode);
  try {
    const rows = (await readFile(new URL("matchbox/time/evals/test.jsonl", root), "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    for (const row of rows) {
      const result = await parser.parse(row.input);
      expect(result.status, row.input).toBe("ok");
      expect(result.value, row.input).toEqual(row.output);
    }
    const challenges = JSON.parse(
      await readFile(new URL("matchbox/time/evals/challenges.json", root), "utf8"),
    );
    for (const row of challenges)
      expect((await parser.parse(row.input)).status, row.input).toBe("uncertain");
  } finally {
    parser.dispose();
  }
});
