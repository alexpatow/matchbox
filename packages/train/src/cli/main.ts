#!/usr/bin/env bun
import { CommanderError } from "commander";
import { argumentsFor, execute } from "./index.js";
try {
  const args = argumentsFor(process.argv.slice(2));
  if (args.command === "init") {
    const { initialize } = await import("./init.js");
    await initialize(args.rest[0], args.json, args.directory, args.template);
  } else if (args.command === "dev") {
    const { develop } = await import("./dev.js");
    await develop(args.config ?? args.target, args.port, args.open);
  } else if (!args.command) {
    const { overview } = await import("./overview.js");
    await overview();
  } else await execute(args);
} catch (error) {
  if (!(error instanceof CommanderError && error.exitCode === 0)) {
    const message = error instanceof Error ? error.message : String(error);
    if (process.argv.includes("--json")) console.error(JSON.stringify({ error: message }));
    else console.error(`\nMatchbox: ${message}`);
    process.exitCode = 1;
  }
}
