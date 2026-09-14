import { expect, test } from "bun:test";
import manifest from "../packages/cli/package.json";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  unlink,
  writeFile,
  rename,
  realpath,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
const root = resolve(".");
async function cli(args: string[], cwd = root) {
  const child = Bun.spawn(["bun", resolve(root, "packages/cli/dist/cli.js"), ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [code, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  return { code, stdout, stderr };
}
test("CLI help, validation, and piped input are predictable", async () => {
  expect((await cli(["--help"])).stdout).toContain("matchbox-ai inspect");
  expect((await cli(["train", "--bogus"])).code).toBe(1);
  expect((await cli(["parse"])).stderr).toContain("Usage:");
  expect((await cli(["--version"])).stdout).toContain(manifest.version);
});
test("a scaffold trains, discovers nested projects, saves corrections, and evaluates without training files", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "matchbox-cli-"));
  const project = resolve(temporary, "parser-project");
  try {
    await mkdir(project);
    await writeFile(
      resolve(project, "package.json"),
      JSON.stringify({ name: "existing-app", scripts: { dev: "vite", build: "vite build" } }),
    );
    const initialized = await cli([
      "init",
      "--skip-install",
      "money",
      "--directory",
      project,
      "--template",
      "money",
      "--json",
    ]);
    expect(initialized.code).toBe(0);
    const evaluation = await readFile(resolve(project, "matchbox/money/evals/test.jsonl"), "utf8");
    const taskRoot = resolve(project, "matchbox/money");
    for (const name of ["parser", "pipeline", "recipe"]) {
      await mkdir(resolve(taskRoot, name));
      await rename(resolve(taskRoot, `${name}.ts`), resolve(taskRoot, name, `${name}.ts`));
    }
    const recipe = resolve(taskRoot, "recipe/recipe.ts");
    await writeFile(recipe, (await readFile(recipe, "utf8")).replaceAll("./data/", "../data/"));
    const baseline = resolve(taskRoot, "evals/baseline.ts");
    await writeFile(
      baseline,
      (await readFile(baseline, "utf8")).replace('"../parser"', '"../parser/parser"'),
    );
    await symlink(resolve(root, "node_modules"), resolve(project, "node_modules"), "dir");
    const info = await cli(["info", "--json"], resolve(taskRoot, "parser"));
    expect(info.code).toBe(0);
    expect(JSON.parse(info.stdout).pipeline).toBe(
      await realpath(resolve(taskRoot, "pipeline/pipeline.ts")),
    );
    expect((await cli([], project)).stdout).toContain("money");

    expect(
      (
        await cli([
          "init",
          "--skip-install",
          "money",
          "--directory",
          project,
          "--template",
          "money",
          "--json",
        ])
      ).code,
    ).toBe(1);
    const trained = await cli(["train", "--json"], resolve(project, "matchbox/money/data"));
    expect(trained.code).toBe(0);
    const trainingReport = JSON.parse(trained.stdout);
    expect(trainingReport.quantized.examples).toBe(evaluation.trim().split("\n").length);
    expect(trainingReport.quantized.invalidOutputRate).toBe(0);
    expect(trainingReport.quantized.exactAccuracy).toBeGreaterThanOrEqual(0.9);
    expect(trainingReport.quantized.failures.length).toBe(
      Math.round(trainingReport.quantized.examples * (1 - trainingReport.quantized.exactAccuracy)),
    );
    const prediction = await cli(["parse", "around fifteen grand euros", "--json"], project);
    expect(JSON.parse(prediction.stdout).value.amount).toBe(15000);
    const inspection = await cli(["inspect", "around fifteen grand euros", "--json"], project);
    expect(JSON.parse(inspection.stdout).tokens.length).toBeGreaterThan(0);
    const heldOut = JSON.parse(evaluation.split("\n")[0]!);
    expect(
      (await cli(["save", heldOut.input, JSON.stringify(heldOut.output), "--json"], project)).code,
    ).toBe(1);
    expect(
      (
        await cli(
          [
            "save",
            "dax euros",
            JSON.stringify({ amount: 15, currency: "EUR", approximate: false }),
            "--json",
          ],
          project,
        )
      ).code,
    ).toBe(0);
    expect(await readFile(resolve(project, "matchbox/money/evals/test.jsonl"), "utf8")).toBe(
      evaluation,
    );
    const beforeSecondTask = await readFile(
      resolve(project, "matchbox/money/pipeline/pipeline.ts"),
      "utf8",
    );
    expect(
      (
        await cli([
          "init",
          "--skip-install",
          "other",
          "--directory",
          project,
          "--template",
          "money",
          "--json",
        ])
      ).code,
    ).toBe(0);
    expect(await readFile(resolve(project, "matchbox/money/pipeline/pipeline.ts"), "utf8")).toBe(
      beforeSecondTask,
    );
    expect((await cli(["info", "--json"], project)).stderr).toContain("Choose a task");
    expect((await cli(["info", "money", "--json"], project)).code).toBe(0);
    await unlink(resolve(project, "matchbox/money/data/train.jsonl"));
    await unlink(resolve(taskRoot, "recipe/recipe.ts"));
    const wrapper = await readFile(resolve(project, ".matchbox/money/model.ts"), "utf8");
    expect(wrapper).toContain("/decode/decode");
    expect(wrapper).toContain("/parser/parser");
    expect(wrapper).not.toContain("recipe");
    expect(wrapper).not.toContain("@matchbox-ai/train");
    const evaluated = await cli(["eval", "money", "--json"], project);
    expect(evaluated.code).toBe(0);
    expect(JSON.parse(evaluated.stdout)).toEqual(trainingReport.quantized);
    await writeFile(
      resolve(project, "matchbox/money/matchbox.config.ts"),
      'export default { output: "./missing.matchbox" };',
    );
    const configured = await cli([
      "parse",
      "twenty dollars",
      "--config",
      resolve(project, "matchbox/money"),
      "--json",
    ]);
    expect(configured.code).toBe(1);
    expect(configured.stderr).toContain("missing.matchbox");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}, 90000);
