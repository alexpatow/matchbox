import { expect, test } from "bun:test";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { defineParser } from "@matchbox-ai/core";
import { z } from "zod";

test("defaults from a separate Zod installation are frozen through nested containers", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "matchbox-zod-"));
  try {
    await cp(dirname(fileURLToPath(import.meta.resolve("zod/package.json"))), temporary, {
      recursive: true,
    });
    const foreign: typeof import("zod") = await import(
      pathToFileURL(resolve(temporary, "index.js")).href
    );
    expect(foreign.z.ZodObject).not.toBe(z.ZodObject);
    let fallback = false;
    const item = foreign.z.strictObject({ enabled: foreign.z.boolean().default(() => fallback) });
    const task = defineParser({
      input: foreign.z.string().min(1),
      output: foreign.z.strictObject({
        direct: foreign.z.boolean().default(() => fallback),
        items: foreign.z.array(item),
        maybe: item.nullable(),
        optional: item.optional(),
        choice: foreign.z.union([item, foreign.z.null()]),
      }),
    });
    const metadata = task.toJSON();
    fallback = true;
    expect(task.validateOutput({ items: [{}], maybe: {}, optional: {}, choice: {} })).toEqual({
      success: true,
      data: {
        direct: false,
        items: [{ enabled: false }],
        maybe: { enabled: false },
        optional: { enabled: false },
        choice: { enabled: false },
      },
    });
    expect(task.toJSON()).toEqual(metadata);
    expect(metadata.output.properties?.direct).toMatchObject({ type: "boolean", default: false });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
