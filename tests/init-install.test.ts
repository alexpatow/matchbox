import { expect, test } from "bun:test";
import { chmod, realpath, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { packageManager } from "../packages/cli/src/commands/install";
const cli = resolve("packages/cli/dist/cli.js");

test("package manager detection respects declarations, lockfiles, and workspace ancestors", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "matchbox-detection-"));
  try {
    await writeFile(
      resolve(root, "package.json"),
      JSON.stringify({ packageManager: "pnpm@10.0.0" }),
    );
    await writeFile(resolve(root, "bun.lock"), "");
    expect(await packageManager(root)).toBe("pnpm");
    const app = resolve(root, "apps/web");
    await mkdir(app, { recursive: true });
    await writeFile(resolve(app, "package.json"), "{}");
    expect(await packageManager(app)).toBe("pnpm");
    await writeFile(resolve(root, "package.json"), "{}");
    expect(await packageManager(root)).toBe("bun");
    await rm(resolve(root, "bun.lock"));
    await writeFile(resolve(root, "package-lock.json"), "{}");
    expect(await packageManager(root)).toBe("npm");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

for (const scenario of ["npm", "pnpm", "yarn", "failure", "skip"])
  test(`init dependency installation: ${scenario}`, async () => {
    const root = await mkdtemp(resolve(tmpdir(), "matchbox-install-test-"));
    const manager = ["failure", "skip"].includes(scenario) ? "npm" : scenario;
    try {
      const bin = resolve(root, "bin");
      await mkdir(bin);
      const executable = resolve(bin, manager);
      await writeFile(
        executable,
        `#!/bin/sh\nprintf '%s' "$PWD:$*" > install-call\necho installer-stdout\necho installer-stderr >&2\nexit ${scenario === "failure" ? 7 : 0}\n`,
      );
      await chmod(executable, 0o755);
      await writeFile(
        resolve(root, "package.json"),
        JSON.stringify({
          name: "consumer",
          packageManager: `${manager}@${manager === "yarn" ? "1.22.22" : "10.0.0"}`,
          dependencies: { "@matchbox-ai/core": "workspace:*", zod: "4.6.3" },
          devDependencies: {
            "@matchbox-ai/train": "workspace:*",
            "@matchbox-ai/cli": "workspace:*",
          },
        }),
      );
      const child = Bun.spawn(
        [
          process.execPath,
          cli,
          "init",
          "intent",
          "--template",
          "blank",
          "--json",
          ...(scenario === "skip" ? ["--skip-install"] : []),
        ],
        {
          cwd: root,
          env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
          stdout: "pipe",
          stderr: "pipe",
        },
      );
      const [code, stdout, stderr] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
      ]);
      if (scenario === "failure") {
        expect(code).toBe(1);
        expect(stdout).toBe("");
        expect(stderr).toContain('Run \\"npm i\\"');
        expect(await Bun.file(resolve(root, "matchbox/intent/parser.ts")).exists()).toBe(true);
      } else {
        expect(code).toBe(0);
        expect(JSON.parse(stdout)).toMatchObject({
          packageManager: manager,
          installed: scenario !== "skip",
        });
      }
      if (scenario === "skip") {
        expect(await Bun.file(resolve(root, "install-call")).exists()).toBe(false);
        expect(JSON.parse(stdout).next[0]).toBe("npm i");
      } else {
        expect(await readFile(resolve(root, "install-call"), "utf8")).toBe(
          `${await realpath(root)}:${manager === "yarn" ? "install" : "i"}`,
        );
        expect(stderr).toContain("installer-stdout");
        expect(stderr).toContain("installer-stderr");
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
