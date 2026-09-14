import { Command, Option } from "commander";
export interface Arguments {
  command?: string;
  target?: string;
  config?: string;
  directory?: string;
  template?: string;
  skipInstall?: boolean;
  port?: string;
  open?: boolean;
  json?: boolean;
  verbose?: boolean;
  rest: string[];
}
export function program() {
  const cli = new Command("matchbox")
    .description("Build small models for the browser.")
    .version("0.0.0", "-v, --version")
    .showHelpAfterError()
    .exitOverride();
  const commands = {
    init: "Add a task to an existing application.",
    dev: "Open the browser workbench alongside your app.",
    train: "Train, validate, and package a browser model.",
    eval: "Evaluate the saved model against independent test examples.",
    parse: "Run a local prediction.",
    inspect: "Show recognition details for a prediction.",
    info: "Show resolved task paths.",
    save: "Save an explicit correction to training data.",
  };
  for (const [name, description] of Object.entries(commands)) {
    const command = cli.command(name).description(description);
    if (name !== "dev") command.option("--json", "Print JSON for scripts.");
    if (name === "init") {
      command
        .argument("[name]", "Task name.")
        .option("--directory <path>", "Existing application directory.")
        .option("--skip-install", "Write the scaffold without installing dependencies.")
        .addOption(
          new Option("--template <name>", "Explicit starter pipeline.").choices(["money", "blank"]),
        );
    } else {
      command
        .argument("[task]", "Task name or path; optional with one task.")
        .option("-c, --config <path>", "Explicit configuration path.");
      if (["parse", "inspect", "save"].includes(name)) command.argument("[input]", "Input text.");
      if (name === "save") command.argument("[output]", "Correct output as JSON.");
      if (name === "train") command.option("--verbose", "Show detailed training progress.");
      if (name === "dev")
        command
          .option("--port <number>", "Workbench port.", "4190")
          .option("--no-open", "Do not open a browser.");
    }
  }
  cli.addHelpText(
    "after",
    "\nExamples:\n  matchbox init money --template money\n  matchbox dev money\n  matchbox inspect money 'twenty dollars'\n\nYour app keeps its own dev server. Matchbox writes artifacts to .matchbox/.",
  );
  return cli;
}
export function argumentsFor(argv: string[]): Arguments {
  const cli = program();
  cli.configureOutput({ writeErr: () => {} });
  let parsed: Arguments = { rest: [] };
  for (const command of cli.commands)
    command.action(() => {
      const name = command.name();
      const rest = [...command.args];
      const opts = command.opts();
      const count = name === "save" ? 2 : ["parse", "inspect"].includes(name) ? 1 : 0;
      if (rest.length < count)
        throw new Error(
          `Usage: matchbox ${name} [task] '<input>'${count === 2 ? " '<JSON>'" : ""}`,
        );
      const target = name !== "init" && rest.length > count ? rest.shift() : undefined;
      if (opts.config && target) throw new Error("Choose either --config or a task argument.");
      parsed = { command: name, rest, ...opts, ...(target ? { target } : {}) };
    });
  cli.action(() => {});
  cli.parse(argv, { from: "user" });
  return parsed;
}
export const help = program().helpInformation();
