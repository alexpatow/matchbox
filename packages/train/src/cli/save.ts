import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { ParserDefinition } from "@matchbox-ai/core";
import type { z } from "zod";
import { readEvaluation } from "./read-evaluation.js";
import { loadConfig } from "../project/index.js";
export async function saveExample(path: string, input: string, output: unknown) {
  const { config, root } = await loadConfig(path);
  const task: ParserDefinition<z.ZodType> = (
    await import(pathToFileURL(resolve(root, config.task)).href)
  ).default;
  const heldOut = (
    await Promise.all(
      [config.validation, config.eval].map(async (file) => {
        const text = await readFile(resolve(root, file), "utf8");
        return text.trim() ? readEvaluation(text, file, task) : [];
      }),
    )
  ).flat();
  const checkedInput = task.validateInput(input);
  const checkedOutput = task.validateOutput(output);
  if (!checkedInput.success || !checkedOutput.success)
    throw new Error("The correction does not satisfy the task schema.");
  const key = input.trim().toLowerCase();
  if (heldOut.some((row) => row.input.trim().toLowerCase() === key))
    throw new Error("This input belongs to a held-out split. Save a different training example.");
  const file = resolve(root, config.train);
  const current = await readFile(file, "utf8");
  const rows = current
    .trim()
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
  const matching = rows.filter((row) => row.input.trim().toLowerCase() === key);
  if (matching.length > 1)
    throw new Error(
      "Multiple training rows match this input. Edit the dataset to resolve duplicates first.",
    );
  const index = rows.findIndex((row) => row.input.trim().toLowerCase() === key);
  const example = { input: checkedInput.data, output: checkedOutput.data };
  if (index < 0) rows.push(example);
  else rows[index] = example;
  await writeFile(file, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
  return {
    saved: file,
    action: index < 0 ? "added" : "updated",
    example,
    next: config.sequence
      ? `Saved output. Update token supervision in ${resolve(root, config.sequence.recipe)} for this input, then run matchbox train.`
      : "Run matchbox train to include this correction.",
  };
}
