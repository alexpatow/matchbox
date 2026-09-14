import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { evaluate } from "@matchbox-ai/train";
import { loadArtifact } from "@matchbox-ai/train/project";
import { createParser, type MatchboxParser } from "@matchbox-ai/core/runtime";
import { tokenize } from "@matchbox-ai/core/internal";
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const results = [];
for (const name of ["is-even", "money", "time", "filters"]) {
  const root = resolve(`examples/${name}/matchbox/${name}`);
  const model = await loadArtifact(root);
  const recipe = (await import(pathToFileURL(model.config.sequence!.recipe).href)).default;
  const trainingText = await readFile(resolve(root, "data/train.jsonl"), "utf8");
  const training = [
    ...trainingText
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line)),
    ...(recipe.rejections ?? []),
  ];
  const supervisionSha256 = hash(
    JSON.stringify(
      training.map((row) => ({
        ...row,
        labels: recipe.annotate(row, tokenize(row.input, recipe.tokenizer)),
      })),
    ),
  );
  const report = JSON.parse(await readFile(resolve(dirname(model.output), "report.json"), "utf8"));
  const artifactSha256 = hash(await readFile(model.output, "utf8"));
  if (report.supervisionSha256 !== supervisionSha256 || report.artifactSha256 !== artifactSha256) {
    throw new Error(`Stale training report or artifact for ${name}. Run bun run train first.`);
  }
  const source = await readFile(resolve(root, "evals/generalization.json"), "utf8");
  const cases: { slice: string; input: string; output: unknown }[] = JSON.parse(source);
  for (const row of cases) {
    if (
      !model.task.validateInput(row.input).success ||
      (row.output !== null && !model.task.validateOutput(row.output).success)
    ) {
      throw new Error(`Invalid evaluation case: ${row.input}`);
    }
  }
  const signature = (input: string) =>
    JSON.stringify(tokenize(input, recipe.tokenizer).map((t) => t.key));
  const seen = new Set(training.map((row) => signature(row.input)));
  const regression = (await readFile(resolve(root, "evals/test.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  const score = async (parser: MatchboxParser<unknown>, rows = cases) => {
    const result = await evaluate(
      parser,
      rows,
      (value) => model.task.validateOutput(value).success,
    );
    const negatives = rows.filter((row) => row.output === null).length;
    return {
      ...result,
      negatives,
      falseAccepts: result.failures.filter((row) => row.expected === null && row.actual !== null)
        .length,
    };
  };
  try {
    const learned = await score(model.parser);
    const slices = Object.fromEntries(
      await Promise.all(
        [...new Set(cases.map((row) => row.slice))].map(async (slice) => [
          slice,
          await score(
            model.parser,
            cases.filter((row) => row.slice === slice),
          ),
        ]),
      ),
    );
    const thresholds = [];
    for (const threshold of [0.5, 0.75, 0.9, 0.95, 0.99]) {
      const parser = createParser({ ...model.artifact, threshold }, model.task, model.decode);
      try {
        thresholds.push({ threshold, ...(await score(parser)) });
      } finally {
        parser.dispose();
      }
    }
    results.push({
      name,
      caseSha256: hash(source),
      trainingSha256: hash(trainingText),
      artifactSha256,
      supervisionSha256,
      provenance:
        "Hand-authored synthetic audit cases. Not a user-traffic sample. Do not tune against this file.",
      regression: {
        examples: regression.length,
        featureEquivalentToTraining: regression.filter((row) => seen.has(signature(row.input)))
          .length,
      },
      novelty: {
        examples: cases.length,
        featureEquivalentToTraining: cases.filter((row) => seen.has(signature(row.input))).length,
      },
      novelOnly: {
        learned: await score(
          model.parser,
          cases.filter((row) => !seen.has(signature(row.input))),
        ),
      },
      predictions: await Promise.all(
        cases.map(async (row) => ({ ...row, result: await model.parser.parse(row.input) })),
      ),
      learned,
      slices,
      thresholds,
    });
    console.log(
      `${name}: neural ${learned.exactAccuracy.toFixed(3)}, false accepts ${learned.falseAccepts}/${learned.negatives}`,
    );
  } finally {
    model.parser.dispose();
  }
}
await mkdir(".matchbox", { recursive: true });
await writeFile(".matchbox/example-evaluation.json", JSON.stringify(results, null, 2) + "\n");
