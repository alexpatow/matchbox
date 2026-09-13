import type { SequenceRecipe } from "@matchbox-ai/train";
import annotations from "../data/train-spans.json";
const spans: Record<string, string[]> = annotations;
const recipe: SequenceRecipe = {
  tokenizer: "words",
  readout: "all",
  labels: ["O", "AMOUNT", "EUR", "USD", "GBP", "SEK", "THOUSAND", "MILLION", "APPROX"],
  annotate(example) {
    const labels = spans[example.input];
    if (!labels) throw new Error(`Missing training span supervision: ${example.input}`);
    return labels;
  },
};
export default recipe;
