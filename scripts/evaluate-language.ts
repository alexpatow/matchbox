import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { evaluate } from "@matchbox-ai/train";
import { loadArtifact } from "@matchbox-ai/train/project";
import { createParser } from "@matchbox-ai/core/runtime";
import { tokenize } from "@matchbox-ai/core/internal";
const split = process.argv[2] ?? "development";
if (!["development", "test"].includes(split)) {
  throw new Error("Expected development or test.");
}
const results = [];
for (const name of ["money", "time", "filters"]) {
  const root = resolve(`examples/${name}/matchbox/${name}`);
  const model = await loadArtifact(root);
  const text = await Bun.file(`${root}/evals/language-${split}.jsonl`).text();
  const rows = text
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  const train = (await Bun.file(`${root}/data/train.jsonl`).text())
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  const signature = (input: string) => JSON.stringify(tokenize(input, "words").map((t) => t.key));
  const recipe = (await import(pathToFileURL(model.config.sequence!.recipe).href)).default;
  const seen = new Set([...train, ...(recipe.rejections ?? [])].map((row) => signature(row.input)));
  const equivalent = rows.filter((row) => seen.has(signature(row.input))).map((row) => row.input);
  const artifact = process.argv[3]
    ? await Bun.file(`${process.argv[3]}/${name}.matchbox`).json()
    : await Bun.file(model.output).json();
  const parser = createParser(artifact, model.task, model.decode);
  try {
    const novelOnly = await evaluate(
      parser,
      rows.filter((row) => !seen.has(signature(row.input))),
      (value) => model.task.validateOutput(value).success,
    );
    const result = await evaluate(
      parser,
      rows,
      (value) => model.task.validateOutput(value).success,
    );
    const falseAccepts = result.failures.filter(
      (row) => row.expected === null && row.actual !== null,
    ).length;
    results.push({
      name,
      split,
      artifactSha256: createHash("sha256").update(JSON.stringify(artifact)).digest("hex"),
      caseSha256: createHash("sha256").update(text).digest("hex"),
      featureEquivalent: equivalent,
      novelOnly,
      ...result,
      falseAccepts,
    });
    console.log(
      `${name}: ${result.exactAccuracy} exact, ${falseAccepts} false accepts, ${equivalent.length} feature-equivalent training cases`,
    );
  } finally {
    parser.dispose();
    model.parser.dispose?.();
  }
}
await Bun.write(
  process.env.MATCHBOX_LANGUAGE_REPORT ?? `.matchbox/language-${split}.json`,
  JSON.stringify(results, null, 2) + "\n",
);
