import { parseArgs } from "node:util";
export function argumentsFor(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    options: {
      directory: { type: "string" },
      config: { type: "string", short: "c" },
      json: { type: "boolean" },
      verbose: { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });
  const [command, ...rest] = positionals;
  if (
    command &&
    !["init", "dev", "train", "eval", "parse", "inspect", "info", "save"].includes(command)
  )
    throw new Error(`Unknown command "${command}". Run matchbox --help.`);
  const inputCount = command === "save" ? 2 : ["parse", "inspect"].includes(command ?? "") ? 1 : 0;
  const max = command === "init" ? 1 : inputCount + 1;
  if (rest.length > max) throw new Error(`Unexpected argument: ${rest[max]}. Run matchbox --help.`);
  if (rest.length < inputCount && !values.help)
    throw new Error(
      `Usage: matchbox ${command} [task] '<input>'${command === "save" ? " '<correct JSON>'" : ""}`,
    );
  if (values.directory && command !== "init")
    throw new Error("--directory is only available for init.");
  const target = command !== "init" && rest.length > inputCount ? rest.shift() : undefined;
  if (values.config && target) throw new Error("Choose either --config or a task argument.");
  return { command, rest, target, ...values };
}
export const help = `Matchbox compiles examples into tiny browser models.

  matchbox init [name]             Add a task under matchbox/<name>.
  matchbox dev [task]              Open the local development session.
  matchbox train [task]            Train, validate, and package.
  matchbox eval [task]             Evaluate the saved model on held-out test data.
  matchbox parse [task] '<input>'  Run a local prediction.
  matchbox inspect [task] '<input>' Show model diagnostics.
  matchbox info [task]             Show resolved paths and pipeline.
  matchbox save [task] '<input>' '<JSON>' Save a corrected training example.

  --directory <path>              Scaffold into another project directory (init only).
  --config, -c <path>              Use an explicit task/config path.
  --json                          Print machine-readable output.
  --verbose                       Print detailed training progress.
  --help, -h                      Show help.
  --version, -v                   Show version.

A task contains parser.ts, pipeline.ts, data/train.jsonl, and evals/.
Discovery walks up from the current directory. Multiple tasks require a name.`;
