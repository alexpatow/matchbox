#!/usr/bin/env bun
import { argumentsFor, help, execute } from "./terminal/index.js";
try {
  const args = argumentsFor(process.argv.slice(2));
  if (args.help) console.log(help);
  else if (args.version) console.log("Matchbox 0.0.0");
  else if (args.command === "init") {
    const { initialize } = await import("./terminal/init.js");
    await initialize(args.rest[0], args.json);
  } else if (!args.command || args.command === "dev") {
    const { develop } = await import("./terminal/dev.js");
    await develop(args.config);
  } else await execute(args);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (process.argv.includes("--json")) console.error(JSON.stringify({ error: message }));
  else console.error(`\nMatchbox: ${message}`);
  process.exitCode = 1;
}
