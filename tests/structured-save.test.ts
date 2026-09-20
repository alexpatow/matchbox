import { expect, test } from "bun:test";
import { mkdtemp, writeFile, readFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { saveExample } from "../packages/cli/src/commands/save";
test("structured corrections protect held-out inputs after defaults and property canonicalization", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "matchbox-structured-save-"));
  try {
    await symlink(resolve("node_modules"), resolve(root, "node_modules"), "dir");
    await writeFile(
      resolve(root, "parser.ts"),
      'import { defineParser } from "@matchbox-ai/core"; import { z } from "zod"; export default defineParser({input:z.strictObject({x:z.number(),flag:z.boolean().default(true)}),output:z.strictObject({kind:z.string()})});',
    );
    await writeFile(
      resolve(root, "pipeline.ts"),
      'export default {prediction:{kind:"field-classifier"}};',
    );
    await writeFile(
      resolve(root, "matchbox.config.ts"),
      'export default {train:"train.jsonl",validation:"validation.jsonl",eval:"test.jsonl"};',
    );
    const row = (x: number) => JSON.stringify({ input: { x }, output: { kind: "a" } }) + "\n";
    await writeFile(resolve(root, "train.jsonl"), row(1));
    await writeFile(resolve(root, "validation.jsonl"), row(2));
    await writeFile(resolve(root, "test.jsonl"), row(3));
    await expect(saveExample(root, '{"flag":true,"x":2}', { kind: "b" })).rejects.toThrow(
      /held-out/,
    );
    const saved = await saveExample(root, '{"flag":true,"x":1}', { kind: "b" });
    expect(saved.action).toBe("updated");
    const rows = (await readFile(resolve(root, "train.jsonl"), "utf8")).trim().split("\n");
    expect(rows).toHaveLength(1);
    expect(JSON.parse(rows[0]!)).toEqual({ input: { x: 1, flag: true }, output: { kind: "b" } });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
