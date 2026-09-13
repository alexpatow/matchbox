import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { discover, loadArtifact, loadConfig } from "../project/index.js";
import { evaluateSequence } from "../sequence/evaluate-sequence.js";
import { metrics, print } from "./output.js";
import type { argumentsFor } from "./args.js";
export async function execute(args: ReturnType<typeof argumentsFor>) {
  const command = args.command!;
  const path = await discover(
    args.config ?? (["train", "eval"].includes(command) ? args.rest[0] : undefined),
  );
  if (command === "info") {
    const { config, root } = await loadConfig(path);
    print(
      {
        config: path,
        authoring: config.sequence ? "custom sequence" : "learned structured values",
        task: resolve(root, config.task),
        train: resolve(root, config.train),
        validation: resolve(root, config.validation),
        eval: resolve(root, config.eval),
        output: resolve(root, config.output),
      },
      args.json,
    );
    return;
  }
  if (command === "save") {
    const { saveExample } = await import("./save.js");
    print(await saveExample(path, args.rest[0]!, JSON.parse(args.rest[1]!)), args.json);
    return;
  }
  if (command === "train") {
    if (!args.json)
      console.log(`\nMatchbox · ${path}\n\n  Validating examples and preparing training…`);
    const { run } = await import("../run.js");
    const result = await run("train", path, (epoch, loss) => {
      if (!args.json && (args.verbose || epoch === 1 || epoch === 100 || epoch % 10 === 0))
        console.error(`  Training epoch ${epoch} · loss ${loss.toFixed(6)}`);
    });
    if ("report" in result) {
      if (args.json) print(result.report, true);
      else {
        console.log("\n  Model packaged successfully.");
        metrics(result.report.quantized);
        console.log(
          `  Size          ${result.report.bytes.toLocaleString()} bytes · ${result.report.parameters.toLocaleString()} parameters\n  Output        ${result.output}\n\nRun matchbox to try it interactively.`,
        );
      }
    }
    return;
  }
  const model = await loadArtifact(path);
  if (command === "eval") {
    const source = resolve(model.root, model.config.eval);
    const { readEvaluation } = await import("./read-evaluation.js");
    const examples = readEvaluation(await readFile(source, "utf8"), source, model.task);
    const result = await evaluateSequence(
      model.parser,
      examples,
      (value) => model.task.validateOutput(value).success,
    );
    if (args.json) print(result, true);
    else metrics(result);
    if (result.exactAccuracy < model.config.minAccuracy) process.exitCode = 1;
    return;
  }
  const input = args.rest[0]!;
  const result = await model.parser.parse(input);
  if (command === "inspect") {
    const details =
      model.task.validateInput(input).success && input.length <= 512 ? model.inspect(input) : {};
    print({ input, ...details, result }, args.json);
  } else print(result, args.json);
}
