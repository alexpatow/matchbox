import { sequenceParity } from "./export-parity.js";
import { prepareSupervision } from "./prepare-supervision.js";
import { fit, predict } from "../../native/index.js";
import { tensorPredictor, tokenize, windows } from "@matchbox-ai/core/internal";
import type { SequenceArtifact } from "@matchbox-ai/core/internal";
import type { DatasetExample } from "@matchbox-ai/core";
import type { SequenceRecipe } from "./types.js";
export async function fitSequence(
  examples: readonly DatasetExample<unknown>[],
  recipe: SequenceRecipe,
  metadata: Pick<SequenceArtifact, "taskModule" | "taskMetadata" | "decoderModule">,
  probes: readonly string[] = [],
  progress?: (epoch: number, loss: number) => void,
) {
  const { vocabulary, radius, dropout, inputs, labels } = prepareSupervision(examples, recipe);
  const result = await fit(
    { vocabularySize: vocabulary.length + 2, labelCount: recipe.labels.length },
    inputs,
    labels,
    progress,
  );
  const artifact = (weights: Uint8Array): SequenceArtifact => ({
    formatVersion: 3,
    engine: "burn-0.21",
    kind: "sequence-parser",
    architecture: "embedding-window-mlp",
    ...metadata,
    tokenizer: recipe.tokenizer,
    readout: recipe.readout,
    vocabulary,
    labels: [...recipe.labels],
    radius: radius as 1,
    unknownTokens: dropout > 0 ? "predict" : "abstain",
    threshold: 0.75,
    precision: "float32",
    weights: Buffer.from(weights).toString("base64"),
  });
  const model = artifact(result.weights);
  const checked = [...examples.slice(0, 16).map((row) => row.input), ...probes];
  const portable = await tensorPredictor(model);
  const parity = sequenceParity(model.threshold);
  try {
    for (const input of checked) {
      const tokens = tokenize(input, recipe.tokenizer);
      if (!tokens.length) {
        continue;
      }
      const scores = predict(
        { vocabularySize: vocabulary.length + 2, labelCount: recipe.labels.length },
        result.weights,
        windows(tokens, vocabulary, radius),
      );
      portable.sequence(input).forEach((token, index) => {
        const row = scores.slice(index * recipe.labels.length, (index + 1) * recipe.labels.length);
        const confidence = Math.max(...row);
        parity.add({ label: recipe.labels[row.indexOf(confidence)]!, confidence }, token);
      });
    }
  } finally {
    portable.dispose();
  }
  return {
    model,
    parameters: result.parameters,
    history: result.loss,
    parity: { examples: checked.length, ...parity.report() },
    supervisedTokens: inputs.length,
  };
}
