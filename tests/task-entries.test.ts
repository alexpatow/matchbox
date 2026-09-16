import { expect, test } from "bun:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { findEntry, resolveModule } from "../packages/train/src/project/entry";
import { discover, listTasks, loadConfig } from "../packages/train/src/project";

for (const name of ["parser", "pipeline", "recipe", "decode"]) {
  test(`${name} resolves a named file or folder and rejects competing entries`, async () => {
    const root = await mkdtemp(resolve(tmpdir(), "matchbox-entries-"));
    try {
      expect(await findEntry(root, name)).toBeUndefined();
      await mkdir(resolve(root, name));
      const nested = resolve(root, name, `${name}.ts`);
      await writeFile(nested, "export default {};\n");
      expect(await findEntry(root, name)).toBe(nested);
      expect(await resolveModule(root, `./${name}`)).toBe(nested);
      const flat = resolve(root, `${name}.ts`);
      await writeFile(flat, "export default {};\n");
      await expect(findEntry(root, name)).rejects.toThrow("Conflicting task entry points");
      expect(await resolveModule(root, `./${name}.ts`)).toBe(flat);
      await rm(nested);
      expect(await findEntry(root, name)).toBe(flat);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}

test("directory-backed tasks are discovered from the application and inside the parser folder", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "matchbox-task-"));
  const task = resolve(root, "matchbox/money");
  try {
    for (const name of ["parser", "pipeline", "recipe", "decode"]) {
      await mkdir(resolve(task, name), { recursive: true });
    }
    await writeFile(resolve(task, "parser/parser.ts"), "export default {};\n");
    await writeFile(
      resolve(task, "pipeline/pipeline.ts"),
      'export default { prediction: { kind: "token-classifier", contextRadius: 4 } };\n',
    );
    await writeFile(
      resolve(task, "recipe/recipe.ts"),
      'throw new Error("Do not import recipes during discovery");',
    );
    await writeFile(
      resolve(task, "decode/decode.ts"),
      'throw new Error("Do not import decoders during discovery");',
    );
    expect(await listTasks(root)).toEqual(["money"]);
    expect(await discover("money", root)).toBe(task);
    expect(await discover(undefined, resolve(task, "parser"))).toBe(task);
    const { config, pipelinePath } = await loadConfig(task);
    expect(pipelinePath).toBe(resolve(task, "pipeline/pipeline.ts"));
    expect(config.task).toBe(resolve(task, "parser/parser.ts"));
    expect(config.sequence).toEqual({
      recipe: resolve(task, "recipe/recipe.ts"),
      decoder: resolve(task, "decode/decode.ts"),
      contextRadius: 4,
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("recurrent discovery resolves training defaults and preserves explicit size limits", async () => {
  for (const maxBytes of [undefined, 42000]) {
    const root = await mkdtemp(resolve(tmpdir(), "matchbox-recurrent-config-"));
    try {
      for (const name of ["parser", "recipe", "decode"]) {
        await writeFile(resolve(root, `${name}.ts`), "export default {};\n");
      }
      const pipeline = {
        prediction: { kind: "recurrent-token-classifier" },
        acceptance: { maxBytes },
      };
      await writeFile(
        resolve(root, "pipeline.ts"),
        `export default ${JSON.stringify(pipeline)};\n`,
      );
      const { config } = await loadConfig(root);
      expect(config.maxBytes).toBe(maxBytes ?? 256000);
      expect(config.sequence?.recurrent).toEqual({
        epochs: 8,
        learningRate: 0.003,
        batchParts: 4096,
        maxInputLength: 262144,
        maxParts: 65536,
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});
