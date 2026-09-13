import { describe, expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import manifest from "../packages/core/package.json";

const coreDirectory = fileURLToPath(new URL("../packages/core", import.meta.url));

describe("built package contract", () => {
  test("ships the ESM and declaration files advertised by its export map", async () => {
    for (const target of Object.values(manifest.exports).flatMap((entry) => Object.values(entry))) {
      expect(await Bun.file(`${coreDirectory}/${target}`).exists()).toBe(true);
    }
  });

  test("a modern Node consumer can import by package name without browser globals", async () => {
    const consumer = Bun.spawn(
      [
        "node",
        "--input-type=module",
        "-e",
        'import { version } from "@matchbox-ai/core"; process.stdout.write(version);',
      ],
      { cwd: coreDirectory, stdout: "pipe", stderr: "pipe" },
    );
    const [output, error, exitCode] = await Promise.all([
      new Response(consumer.stdout).text(),
      new Response(consumer.stderr).text(),
      consumer.exited,
    ]);
    expect(error).toBe("");
    expect(exitCode).toBe(0);
    expect(output).toBe(manifest.version);
  });
});
