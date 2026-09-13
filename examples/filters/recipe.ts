import type { SequenceRecipe } from "@matchbox-ai/train";
const labels: Record<string, string> = {
  active: "STATUS_active",
  inactive: "STATUS_inactive",
  churned: "STATUS_churned",
  swedish: "COUNTRY_SE",
  sweden: "COUNTRY_SE",
  german: "COUNTRY_DE",
  germany: "COUNTRY_DE",
  american: "COUNTRY_US",
  america: "COUNTRY_US",
  norwegian: "COUNTRY_NO",
  norway: "COUNTRY_NO",
  arr: "ARR",
  revenue: "ARR",
  over: "GT",
  above: "GT",
  greater: "GT",
  more: "GT",
  ">": "GT",
  under: "LT",
  below: "LT",
  less: "LT",
  "<": "LT",
  least: "GTE",
  most: "LTE",
  exactly: "EQUAL",
  equal: "EQUAL",
  "=": "EQUAL",
  no: "INVERT",
  not: "NEGATE",
  exclude: "NEGATE",
  except: "NEGATE",
  without: "NEGATE",
  k: "THOUSAND",
  m: "MILLION",
};
/** This build-only lexicon supplies weak token supervision; runtime semantics come from weights. */
const recipe: SequenceRecipe = {
  tokenizer: "words",
  readout: "all",
  labels: ["O", "AMOUNT", ...new Set(Object.values(labels))],
  annotate(_example, tokens) {
    return tokens.map((token) =>
      token.key === "<number>" ? "AMOUNT" : (labels[token.key] ?? "O"),
    );
  },
};
export default recipe;
