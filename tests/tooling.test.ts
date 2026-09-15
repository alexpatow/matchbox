import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

async function tool(name: "lint" | "format:check", directory: string) {
  const child = Bun.spawn(["bun", "run", name, directory], {
    cwd: resolve("."),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [code, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  return { code, output: stdout + stderr };
}

test("the repository lint command rejects unreadable TS and JSX", async () => {
  const directory = await mkdtemp(resolve("tests/tooling-"));
  try {
    await writeFile(
      resolve(directory, "bad.ts"),
      "export function choose(a: number, b: number) { if (a == b) return a ? 1 : b ? 2 : 3; return 0; }\n",
    );
    await writeFile(
      resolve(directory, "bad.tsx"),
      'export function View({ a, b }: { a: boolean; b: boolean }) { return <p>{a ? "a" : b ? "b" : "c"}</p>; }\n',
    );
    const result = await tool("lint", directory);
    expect(result.code).not.toBe(0);
    expect(result.output).toContain("no-nested-ternary");
    expect(result.output).toContain("curly");
    expect(result.output).toContain("eqeqeq");
    expect(result.output).toContain("bad.tsx");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("the repository formatter rejects bad formatting and accepts its own output", async () => {
  const directory = await mkdtemp(resolve("tests/tooling-"));
  try {
    await writeFile(resolve(directory, "example.ts"), 'export const value={message: "hello"}\n');
    expect((await tool("format:check", directory)).code).not.toBe(0);
    const formatter = Bun.spawn(["bunx", "oxfmt", "--write", directory], {
      stdout: "pipe",
      stderr: "pipe",
    });
    await Promise.all([
      new Response(formatter.stdout).text(),
      new Response(formatter.stderr).text(),
    ]);
    expect(await formatter.exited).toBe(0);
    expect((await tool("format:check", directory)).code).toBe(0);
    expect((await tool("lint", directory)).code).toBe(0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
