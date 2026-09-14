import { expect, test } from "bun:test";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
const cli = resolve("packages/train/dist/cli.js");
async function run(args: string[], cwd: string) {
  const child = Bun.spawn(["bun", cli, ...args], { cwd, stdout: "pipe", stderr: "pipe" });
  const [code, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  return { code, stdout, stderr };
}
for (const framework of ["vite", "next"])
  test(`scaffolding preserves the ${framework} app and existing dependencies`, async () => {
    const directory = await mkdtemp(resolve(tmpdir(), "matchbox-existing-"));
    const manifest = {
      name: "app",
      scripts: {
        dev: `${framework} dev`,
        build: `${framework} build`,
        "matchbox:train": "custom train",
      },
      dependencies: { [framework]: "1.0.0", zod: "4.6.3", "@matchbox-ai/core": "workspace:*" },
      devDependencies: { "@matchbox-ai/train": "workspace:*" },
    };
    try {
      await writeFile(resolve(directory, "package.json"), JSON.stringify(manifest));
      const config = resolve(directory, `${framework}.config.ts`);
      await writeFile(config, "export default {};\n");
      await writeFile(resolve(directory, ".gitignore"), "keep-this\n");
      const result = await run(["init", "intent", "--template", "blank", "--json"], directory);
      expect(result.code).toBe(0);
      const after = JSON.parse(await readFile(resolve(directory, "package.json"), "utf8"));
      expect(after.scripts).toMatchObject(manifest.scripts);
      expect(after.dependencies).toEqual(manifest.dependencies);
      expect(after.devDependencies).toEqual(manifest.devDependencies);
      expect(await readFile(config, "utf8")).toBe("export default {};\n");
      expect(await readFile(resolve(directory, ".gitignore"), "utf8")).toBe(
        "keep-this\n.matchbox/\n",
      );
      expect(await readFile(resolve(directory, "matchbox/intent/data/train.jsonl"), "utf8")).toBe(
        "",
      );
      expect((await run(["init", "intent", "--template", "blank", "--json"], directory)).code).toBe(
        1,
      );
      expect(await readFile(config, "utf8")).toBe("export default {};\n");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
test("empty directory and bare command never create an application", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "matchbox-empty-"));
  try {
    expect((await run([], directory)).code).toBe(0);
    const result = await run(["init", "--template", "money", "--json"], directory);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Create your React or Next.js app first");
    expect(await Bun.file(resolve(directory, "package.json")).exists()).toBe(false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
