import { textParts, textFeatures, spanLabels, type RecurrentRecipe } from "@matchbox-ai/train";
export default {
  tokenizer: textParts(),
  features: textFeatures(),
  labels: ["word", "separator"],
  annotate: spanLabels({ whitespace: "supervise" }),
} satisfies RecurrentRecipe;
