import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
async function packageRoot(file: string, name: string): Promise<string> {
  let directory = dirname(file);
  for (;;) {
    const json = await readFile(resolve(directory, "package.json"), "utf8").catch(() => "{}");
    if (JSON.parse(json).name === name) return directory;
    const parent = dirname(directory);
    if (parent === directory) throw new Error(`Cannot find installed ${name}.`);
    directory = parent;
  }
}
export async function initialize(name = "money", json = false, directory = process.cwd()) {
  if (!/^[a-z][a-z0-9-]*$/.test(name))
    throw new Error(
      "Use a kebab-case task name, such as money. Use --directory to choose the project directory.",
    );
  const root = resolve(directory);
  const core = await packageRoot(
    fileURLToPath(import.meta.resolve("@matchbox-ai/core")),
    "@matchbox-ai/core",
  );
  const train = await packageRoot(fileURLToPath(import.meta.url), "@matchbox-ai/train");
  const prefix = `matchbox/${name}`;
  const files: Record<string, string> = {};
  for (const file of [
    "parser.ts",
    "pipeline.ts",
    "data/train.jsonl",
    "evals/validation.jsonl",
    "evals/test.jsonl",
  ])
    files[`${prefix}/${file}`] = await readFile(
      resolve(train, "templates/simple/matchbox/money", file),
      "utf8",
    );
  for (const file of Object.keys(files))
    if (
      await access(resolve(root, file)).then(
        () => true,
        () => false,
      )
    )
      throw new Error(`Refusing to overwrite ${resolve(root, file)}.`);
  const manifestPath = resolve(root, "package.json");
  const previous = await readFile(manifestPath, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
    return null;
  });
  const manifest = previous
    ? JSON.parse(previous)
    : {
        name: "matchbox-parser",
        private: true,
        type: "module",
        scripts: { dev: "matchbox dev", train: "matchbox train", eval: "matchbox eval" },
      };
  manifest.dependencies = {
    "@matchbox-ai/core": `file:${core}`,
    zod: "4.6.3",
    ...manifest.dependencies,
  };
  manifest.devDependencies = { "@matchbox-ai/train": `file:${train}`, ...manifest.devDependencies };
  manifest.overrides = {
    "@matchbox-ai/core": manifest.dependencies["@matchbox-ai/core"],
    ...manifest.overrides,
  };
  manifest.trustedDependencies = [
    ...new Set([...(manifest.trustedDependencies ?? []), "@tensorflow/tfjs-node"]),
  ];
  const ignore = await readFile(resolve(root, ".gitignore"), "utf8").catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
      return "";
    },
  );
  await mkdir(root, { recursive: true });
  for (const [file, text] of Object.entries(files)) {
    await mkdir(dirname(resolve(root, file)), { recursive: true });
    await writeFile(resolve(root, file), text, { flag: "wx" });
  }
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  const additions = ["node_modules/", ".matchbox/"].filter(
    (line) => !ignore.split("\n").includes(line),
  );
  if (additions.length)
    await writeFile(
      resolve(root, ".gitignore"),
      ignore + (ignore && !ignore.endsWith("\n") ? "\n" : "") + additions.join("\n") + "\n",
    );
  const next = ["bun install", `bunx matchbox train ${name}`, `bunx matchbox dev ${name}`];
  if (json)
    console.log(
      JSON.stringify({
        directory: root,
        task: name,
        files: [...Object.keys(files), "package.json", ".gitignore"],
        next,
      }),
    );
  else
    console.log(
      `\nCreated ${prefix} in ${root}.\n\n${next.map((command) => `  ${command}`).join("\n")}\n`,
    );
}
