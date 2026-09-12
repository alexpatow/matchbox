import { defineParser, version } from "@matchbox-ai/core";
import { z } from "zod";

const task = defineParser({
  input: z.string().min(1),
  output: z.strictObject({ version: z.string().min(1) }),
});

/** Exercise the public task contract in-browser without pretending to run inference. */
export function checkPackage(): string {
  const input = task.validateInput("Check the installed package.");
  const output = task.validateOutput({ version });
  if (!input.success || !output.success) throw new Error("The package contract check failed.");
  const metadata = JSON.parse(JSON.stringify(task)) as { formatVersion: number };
  if (metadata.formatVersion !== 1) throw new Error("Unexpected task metadata version.");
  return output.data.version;
}
