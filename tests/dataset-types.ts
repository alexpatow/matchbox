import { parseDatasets } from "@matchbox-ai/core";
import { makeParser } from "./parser-fixture";

const result = parseDatasets(makeParser(), {
  formatVersion: 1,
  train: { source: "train.jsonl", text: "" },
  eval: { source: "evals.jsonl", text: "" },
});
if (result.success) {
  for (const example of result.data.train) {
    const country: "SE" | "DE" = example.output.country;
    const minimum: number = example.output.minimum;
    // @ts-expect-error Output fields retain their inferred schema types.
    const wrong: string = example.output.minimum;
    void [country, minimum, wrong];
  }
} else {
  const source: string | undefined = result.issues[0]?.source;
  void source;
  // @ts-expect-error Failed validation never exposes partial training data.
  void result.data;
}
