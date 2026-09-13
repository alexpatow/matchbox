import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
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
export async function initialize(target?: string, json = false) {
  const interactive = process.stdin.isTTY && process.stdout.isTTY && !json;
  const prompt = interactive
    ? createInterface({ input: process.stdin, output: process.stdout })
    : null;
  try {
    if (!target) {
      if (!prompt) throw new Error("Pass a target directory: matchbox init <directory>.");
      target =
        (
          await prompt.question(
            "\nMatchbox · Create a local parser\n\nProject directory [my-parser]: ",
          )
        ).trim() || "my-parser";
    }
    const root = resolve(target);
    const core = await packageRoot(
      fileURLToPath(import.meta.resolve("@matchbox-ai/core")),
      "@matchbox-ai/core",
    );
    const train = await packageRoot(fileURLToPath(import.meta.url), "@matchbox-ai/train");
    const files: Record<string, string> = {
      "package.json":
        JSON.stringify(
          {
            name: "matchbox-parser",
            private: true,
            type: "module",
            scripts: { dev: "matchbox", train: "matchbox train", eval: "matchbox eval" },
            dependencies: {
              "@matchbox-ai/core": `file:${core}`,
              "@matchbox-ai/train": `file:${train}`,
              zod: "4.6.3",
            },
            overrides: { "@matchbox-ai/core": `file:${core}` },
            trustedDependencies: ["@tensorflow/tfjs-node"],
          },
          null,
          2,
        ) + "\n",
      ".gitignore": "node_modules/\n.matchbox/\n",
      "README.md":
        "# Your parser\n\nEdit parser/parser.ts and parser/data/train.jsonl, then run bun run train. Keep the evals/ fixtures independent.\n\nRun bun run dev for interactive parsing, /inspect, /eval, and /save <JSON> after a prediction. Corrections only change training data. Generated artifacts live in .matchbox/.\n\nThe default model learns primitive field values from examples. It uses no language dictionaries or normalization rules. It can only emit field values seen during training, ignores word order, and abstains on unknown tokens. Add examples and retrain to teach new vocabulary.\n\nThis pre-release starter uses file dependencies pointing to the installed Matchbox packages. Run bun install before training.\n",
    };
    for (const file of [
      "parser/parser.ts",
      "parser/data/train.jsonl",
      "evals/validation.jsonl",
      "evals/evals.jsonl",
    ])
      files[file] = await readFile(resolve(train, "templates/simple", file), "utf8");
    for (const file of Object.keys(files))
      if (
        await access(resolve(root, file)).then(
          () => true,
          () => false,
        )
      )
        throw new Error(`Refusing to overwrite ${resolve(root, file)}. Choose a new directory.`);
    if (prompt) {
      console.log(
        `\n  Task       Money, currencies, and approximation\n  Inputs     ${Object.keys(files)
          .filter((file) => file.endsWith("jsonl"))
          .join(", ")}\n  Authoring  Zod schema and input/output examples\n  Directory  ${root}\n`,
      );
      if (!/^y(es)?$/i.test((await prompt.question("Create these files? [y/N] ")).trim())) return;
    }
    for (const [file, text] of Object.entries(files)) {
      await mkdir(dirname(resolve(root, file)), { recursive: true });
      await writeFile(resolve(root, file), text, { flag: "wx" });
    }
    if (json)
      console.log(
        JSON.stringify({
          directory: root,
          files: Object.keys(files),
          next: ["bun install", "bun run train", "bun run dev"],
        }),
      );
    else
      console.log(
        `\nCreated ${root}.\n\n  cd ${JSON.stringify(root)}\n  bun install\n  bun run train\n  bun run dev\n`,
      );
  } finally {
    prompt?.close();
  }
}
