import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { packageRoot, templateFiles } from "./scaffold-files.js";
import { integrationGuide } from "./integration-guide.js";
import { commandText, installDependencies, packageManager } from "./install.js";
import { choose, terminal } from "./terminal.js";
export async function initialize(
  name?: string,
  json = false,
  directory = process.cwd(),
  selected?: string,
  skipInstall = false,
) {
  const root = resolve(directory);
  const manifestPath = resolve(root, "package.json");
  const manifest = JSON.parse(
    await readFile(manifestPath, "utf8").catch(() => {
      throw new Error(
        `No package.json in ${root}. Create your React or Next.js app first, then run matchbox-ai init inside it.`,
      );
    }),
  );
  const manager = await packageManager(root);
  const template =
    selected ??
    (process.stdin.isTTY && !json
      ? await choose("Choose a starting point", [
          { label: "Money · A trained token model with an explicit decoder", value: "money" },
          { label: "Blank · Author your schema, examples, and pipeline", value: "blank" },
        ])
      : undefined);
  if (!template || !["money", "blank"].includes(template)) {
    throw new Error("Choose --template money or --template blank.");
  }
  name ??= template === "money" ? "money" : "my-task";
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error("Use a kebab-case task name, such as money.");
  }
  const core = await packageRoot(
    fileURLToPath(import.meta.resolve("@matchbox-ai/core")),
    "@matchbox-ai/core",
  );
  const train = await packageRoot(
    fileURLToPath(import.meta.resolve("@matchbox-ai/train")),
    "@matchbox-ai/train",
  );
  const cli = await packageRoot(fileURLToPath(import.meta.url), "matchbox-ai");
  const prefix = `matchbox/${name}`;
  if (
    await access(resolve(root, prefix)).then(
      () => true,
      () => false,
    )
  ) {
    throw new Error(`Refusing to overwrite ${resolve(root, prefix)}.`);
  }
  const files = await templateFiles(
    resolve(cli, "templates", template, "matchbox", template === "money" ? "money" : "task"),
  );
  const dependencies = { ...manifest.devDependencies, ...manifest.dependencies };
  let framework = "JavaScript";
  if (dependencies.next) {
    framework = "Next.js";
  } else if (dependencies.vite) {
    framework = "React/Vite";
  }
  files["README.md"] = integrationGuide(name, template, framework, manager);
  manifest.dependencies ??= {};
  manifest.devDependencies ??= {};
  for (const [name, path, development] of [
    ["@matchbox-ai/core", core, false],
    ["@matchbox-ai/train", train, true],
    ["matchbox-ai", cli, true],
  ] as const) {
    if (dependencies[name]) {
      continue;
    }
    const { version } = JSON.parse(await readFile(resolve(path, "package.json"), "utf8"));
    (development ? manifest.devDependencies : manifest.dependencies)[name] = version;
  }
  if (!dependencies.zod) {
    manifest.dependencies.zod = "4.6.3";
  }
  if (manager === "bun") {
    manifest.trustedDependencies = [
      ...new Set([...(manifest.trustedDependencies ?? []), "@tensorflow/tfjs-node"]),
    ];
  }
  manifest.scripts = {
    "matchbox:dev": "matchbox-ai dev",
    "matchbox:train": "matchbox-ai train",
    "matchbox:eval": "matchbox-ai eval",
    ...manifest.scripts,
  };
  const ignorePath = resolve(root, ".gitignore");
  const ignore = await readFile(ignorePath, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") {
      throw error;
    }
    return "";
  });
  for (const [file, text] of Object.entries(files)) {
    const destination = resolve(root, prefix, file);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, text, { flag: "wx" });
  }
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  if (!ignore.split("\n").includes(".matchbox/")) {
    await writeFile(
      ignorePath,
      ignore + (ignore && !ignore.endsWith("\n") ? "\n" : "") + ".matchbox/\n",
    );
  }
  if (!skipInstall) {
    await installDependencies(root, manager);
  }
  const next = [
    ...(skipInstall ? [commandText(manager, "install")] : []),
    commandText(manager, "execute-local", ["matchbox-ai", "dev", name]),
  ];
  const result = {
    directory: root,
    task: name,
    template,
    framework,
    packageManager: manager,
    installed: !skipInstall,
    files: Object.keys(files).map((file) => `${prefix}/${file}`),
    next,
  };
  if (json) {
    console.log(JSON.stringify(result));
  } else {
    const view = terminal(`Added ${name} to ${framework}`, [
      prefix,
      "",
      ...next,
      "",
      `Integration guide: ${prefix}/README.md`,
    ]);
    view.stop();
  }
}
