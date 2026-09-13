#!/usr/bin/env bun
import { run } from "./run.js";
const [command, config = "matchbox.config.ts"] = process.argv.slice(2);
if (command !== "train" && command !== "eval") {
  console.error("Usage: matchbox <train|eval> [matchbox.config.ts]");
  process.exitCode = 1;
} else {
  try {
    await run(command, config);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
