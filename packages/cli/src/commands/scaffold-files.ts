import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
export async function packageRoot(file: string, name: string): Promise<string> {
  let directory = dirname(file);
  for (;;) {
    const json = await readFile(resolve(directory, "package.json"), "utf8").catch(() => "{}");
    if (JSON.parse(json).name === name) return directory;
    const parent = dirname(directory);
    if (parent === directory) throw new Error(`Cannot find installed ${name}.`);
    directory = parent;
  }
}
export async function templateFiles(
  directory: string,
  prefix = "",
): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isDirectory())
      Object.assign(files, await templateFiles(resolve(directory, entry.name), `${name}/`));
    else files[name] = await readFile(resolve(directory, entry.name), "utf8");
  }
  return files;
}
