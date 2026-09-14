import { execFile } from "node:child_process";
import { mkdir, readFile, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { createHash, randomUUID } from "node:crypto";
const exec = promisify(execFile);
export async function localDependency(source: string, root: string, name: string) {
  const directory = resolve(root, "vendor/matchbox");
  await mkdir(directory, { recursive: true });
  const temporary = resolve(directory, `${randomUUID()}.tgz`);
  try {
    await exec("bun", ["pm", "pack", "--filename", temporary, "--ignore-scripts", "--quiet"], {
      cwd: source,
    });
    const digest = createHash("sha256")
      .update(await readFile(temporary))
      .digest("hex")
      .slice(0, 16);
    const file = `${name}-${digest}.tgz`;
    await rename(temporary, resolve(directory, file));
    return `file:vendor/matchbox/${file}`;
  } finally {
    await rm(temporary, { force: true });
  }
}
