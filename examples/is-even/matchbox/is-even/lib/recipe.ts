import type { SequenceRecipe } from "@matchbox-ai/train";
const recipe: SequenceRecipe = {
  tokenizer: "characters",
  readout: "last",
  labels: ["EVEN", "ODD"],
  annotate(example, tokens) {
    const even = (example.output as { even: boolean }).even;
    return tokens.map((_, index) => (index === tokens.length - 1 ? (even ? "EVEN" : "ODD") : null));
  },
};
export default recipe;
