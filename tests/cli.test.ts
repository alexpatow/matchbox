import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm, symlink, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
const root = resolve(".");
async function cli(args: string[], cwd = root) {
  const child = Bun.spawn(["bun", resolve(root, "packages/train/dist/cli.js"), ...args], {
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
  expect((await cli(["--help"])).stdout).toContain("matchbox inspect");
  expect((await cli(["train", "--bogus"])).code).toBe(1);
  expect((await cli(["parse"])).stderr).toContain("Usage:");
  expect((await cli(["--version"])).stdout).toContain("0.0.0");
});
test("a scaffold trains, discovers nested projects, saves corrections, and evaluates without training files", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "matchbox-cli-"));
  const project = resolve(temporary, "parser-project");
  try {
    const initialized = await cli(["init", project, "--json"]);
    expect(initialized.code).toBe(0);
    const evaluation = await readFile(resolve(project, "evals/evals.jsonl"), "utf8");
    expect((await cli(["init", project, "--json"])).code).toBe(1);
    await symlink(resolve(root, "node_modules"), resolve(project, "node_modules"), "dir");
    const trained = await cli(["train", "--json"], resolve(project, "parser/data"));
    expect(trained.code).toBe(0);
    expect(JSON.parse(trained.stdout).quantized.exactAccuracy).toBe(1);
    const prediction = await cli(["parse", "around fifteen grand euros", "--json"], project);
    expect(JSON.parse(prediction.stdout).value.amount).toBe(15000);
    const inspection = await cli(["inspect", "around fifteen grand euros", "--json"], project);
    expect(JSON.parse(inspection.stdout).fields).toHaveLength(3);
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
    expect(await readFile(resolve(project, "evals/evals.jsonl"), "utf8")).toBe(evaluation);
    await unlink(resolve(project, "parser/data/train.jsonl"));
    const evaluated = await cli(["eval", "--json"], project);
    expect(evaluated.code).toBe(0);
    expect(JSON.parse(evaluated.stdout).exactAccuracy).toBe(1);
    await writeFile(
      resolve(project, "matchbox.config.ts"),
      'export default { output: "./missing.matchbox" };',
    );
    const configured = await cli(["parse", "twenty dollars", "--config", project, "--json"]);
    expect(configured.code).toBe(1);
    expect(configured.stderr).toContain("missing.matchbox");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}, 30000);
