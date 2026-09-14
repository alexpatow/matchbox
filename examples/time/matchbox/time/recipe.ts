import type { SequenceRecipe } from "@matchbox-ai/train";
import annotations from "./data/train-spans.json";
const spans: Record<string, string[]> = annotations;
const recipe: SequenceRecipe = {
  tokenizer: "words",
  readout: "all",
  labels: [
    "O",
    "DURATION",
    "RELATIVE",
    "AMOUNT",
    "SECOND",
    "MINUTE",
    "HOUR",
    "DAY",
    "TODAY",
    "TOMORROW",
    "CLOCK",
    "COLON",
    "AM",
    "PM",
  ],
  annotate(example) {
    const labels = spans[example.input];
    if (!labels) throw new Error(`Missing training annotation: ${example.input}`);
    return labels;
  },
};
export default recipe;
