import { createHash } from "node:crypto";
import { dirname, relative, resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { createParser, readArtifact, type ModelArtifact } from "@matchbox-ai/core/runtime";
import { fit } from "./fit.js";
import { evaluate } from "./evaluate.js";
import { loadProject } from "./load-project.js";
import { packageModel } from "./package-model.js";
const predicate = z.strictObject({
  field: z.string(),
  operator: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
export async function run(command: "train" | "eval", path: string) {
  const project = await loadProject(path);
  const { task, config } = project;
  const validate = (value: unknown) => task.validateOutput(value).success;
  if (command === "eval") {
    const model = readArtifact(JSON.parse(await readFile(project.output, "utf8")));
    console.log(
      JSON.stringify(
        await evaluate(createParser(model, task), project.evaluation, validate),
        null,
        2,
      ),
    );
    return;
  }
  const examples = project.train.map((row) => ({
    input: row.input,
    output: predicate.parse(row.output),
  }));
  const candidates = [];
  const relativeTask = relative(dirname(project.output), project.taskPath).replaceAll("\\", "/");
  const taskModule = relativeTask.startsWith(".") ? relativeTask : `./${relativeTask}`;
  for (const algorithm of ["centroid", "linear"] as const) {
    const model: ModelArtifact = {
      formatVersion: 1,
      kind: "clause-parser",
      taskModule,
      taskMetadata: task.toJSON(),
      threshold: 0.35,
      ...fit(examples, algorithm),
    };
    const metrics = await evaluate(createParser(model, task), project.validation, validate);
    const bytes = Buffer.byteLength(JSON.stringify(model));
    candidates.push({ model, metrics, bytes });
    console.log(
      `${algorithm}: validation ${(metrics.exactAccuracy * 100).toFixed(1)}%, ${bytes} bytes`,
    );
  }
  const winner = candidates
    .filter(
      (item) => item.metrics.exactAccuracy >= config.minAccuracy && item.bytes <= config.maxBytes,
    )
    .sort((a, b) => a.bytes - b.bytes)[0];
  if (!winner)
    throw new Error(
      "No model meets the validation accuracy and artifact size requirements. Nothing was packaged.",
    );
  const results = [];
  for (const candidate of candidates)
    results.push({
      algorithm: candidate.model.algorithm,
      bytes: candidate.bytes,
      validation: candidate.metrics,
      eval: await evaluate(createParser(candidate.model, task), project.evaluation, validate),
    });
  const report = {
    formatVersion: 1,
    selected: winner.model.algorithm,
    artifactSha256: hash(JSON.stringify(winner.model)),
    datasetSha256: project.sources.map((source) => ({
      source: source.source,
      sha256: hash(source.text),
    })),
    examples: {
      train: project.train.length,
      validation: project.validation.length,
      eval: project.evaluation.length,
    },
    requirements: { minValidationAccuracy: config.minAccuracy, maxBytes: config.maxBytes },
    candidates: results,
    baseline: await evaluate(project.baseline, project.evaluation, validate),
    notes:
      "Selection uses validation only. Eval is reported after selection. Scores are not calibrated probabilities. Browser latency is measured separately by Playwright.",
  };
  for (const candidate of candidates) {
    await packageModel(
      resolve(dirname(project.output), `${candidate.model.algorithm}.matchbox`),
      candidate.model,
      {
        role: "comparison candidate",
        algorithm: candidate.model.algorithm,
        bytes: candidate.bytes,
        validation: candidate.metrics,
      },
    );
  }
  await packageModel(project.output, winner.model, report);
  const selectedMetrics = results.find(
    (candidate) => candidate.algorithm === winner.model.algorithm,
  )!.eval;
  console.log(
    `Eval ${(selectedMetrics.exactAccuracy * 100).toFixed(1)}%. Invalid output ${(selectedMetrics.invalidOutputRate * 100).toFixed(1)}%. Artifact ${winner.bytes} bytes. SHA-256 ${report.artifactSha256}.`,
  );
  console.log(
    `Selected ${report.selected}. Full metrics and failures are in ${project.output}.report.json`,
  );
}
