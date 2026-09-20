import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { discover, loadArtifact, loadConfig } from "@matchbox-ai/train/project";
import { evaluate as evaluateSequence } from "@matchbox-ai/train";
import { metrics, print } from "./output.js";
import type { argumentsFor } from "./args.js";
export async function execute(args: ReturnType<typeof argumentsFor>) {
  const command = args.command!;
  const path = await discover(args.config ?? args.target);
  if (command === "info") {
    const { config, root, pipelinePath } = await loadConfig(path);
    let authoring = config.sequence ? "custom sequence" : "learned structured values";
    if (config.features) {
      authoring = "numeric features";
    }
    const task = (await import(pathToFileURL(resolve(root, config.task)).href)).default;
    print(
      {
        inputFormat: task.toJSON().input.type === "string" ? "text" : "json",
        config: path,
        authoring,
        pipeline: pipelinePath ?? null,
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
    const { trainCommand } = await import("./train-command.js");
    await trainCommand(path, args.json, args.verbose);
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
    if (args.json) {
      print(result, true);
    } else {
      metrics(result);
    }
    if (result.exactAccuracy < model.config.minAccuracy) {
      process.exitCode = 1;
    }
    return;
  }
  const input =
    model.task.toJSON().input.type === "string" ? args.rest[0]! : JSON.parse(args.rest[0]!);
  const result = await model.parser.parse(input);
  if (command === "inspect") {
    const details =
      model.task.validateInput(input).success && (typeof input !== "string" || input.length <= 512)
        ? await model.inspect(input)
        : {};
    print({ input, ...details, result }, args.json);
  } else {
    print(result, args.json);
  }
}
