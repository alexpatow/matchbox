import { parseArgs } from "node:util";
export function argumentsFor(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: true,
    options: {
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
  const max =
    command === "save"
      ? 2
      : ["init", "train", "eval", "parse", "inspect"].includes(command ?? "")
        ? 1
        : 0;
  if (rest.length > max) throw new Error(`Unexpected argument: ${rest[max]}. Run matchbox --help.`);
  if (["parse", "inspect"].includes(command ?? "") && rest.length !== 1 && !values.help)
    throw new Error(`Usage: matchbox ${command} '<input>' [--config <path>]`);
  if (command === "save" && rest.length !== 2 && !values.help)
    throw new Error("Usage: matchbox save '<input>' '<correct JSON>'");
  if (values.config && ["train", "eval"].includes(command ?? "") && rest.length)
    throw new Error("Choose either --config or a positional config path.");
  return { command, rest, ...values };
}
export const help = `Matchbox compiles examples into tiny browser models.

  matchbox init [directory]        Create a working money parser project.
  matchbox                        Open the local development session.
  matchbox train [config]          Align, train, validate, and package.
  matchbox eval [config]           Evaluate the packaged model on held-out data.
  matchbox parse '<input>'         Run a local prediction.
  matchbox inspect '<input>'       Show token recognition and normalization.
  matchbox info                    Show resolved paths and authoring mode.
  matchbox save '<input>' '<JSON>'  Save a corrected training example explicitly.

  --config, -c <path>              Use a specific project config.
  --json                          Print machine-readable output.
  --verbose                       Print detailed training progress.
  --help, -h                      Show help.
  --version, -v                   Show version.

Project discovery walks up from the current directory. In a new directory,
run matchbox init first. No inference network requests are made.`;
