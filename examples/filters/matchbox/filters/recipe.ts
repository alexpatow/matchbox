import { countryAliases } from "./countries/aliases";
import type { SequenceRecipe } from "@matchbox-ai/train";
const labels: Record<string, string> = {
  active: "STATUS_active",
  inactive: "STATUS_inactive",
  churned: "STATUS_churned",
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
  hide: "NEGATE",
  omit: "NEGATE",
  excluding: "NEGATE",
  except: "NEGATE",
  without: "NEGATE",
  k: "THOUSAND",
  m: "MILLION",
};
/** This build-only lexicon supplies weak token supervision; runtime semantics come from weights. */
const recipe: SequenceRecipe = {
  tokenizer: "words",
  readout: "all",
  labels: ["O", "AMOUNT", "COUNTRY", ...new Set(Object.values(labels))],
  annotate(_example, tokens) {
    const result = tokens.map((token) =>
      token.key === "<number>" ? "AMOUNT" : (labels[token.key] ?? "O"),
    );
    for (let start = 0; start < tokens.length; start++) {
      const found = countryAliases.find(
        ({ keys, alias, isCode }) =>
          (!isCode || tokens[start]?.text === alias) &&
          keys.every((key, offset) => tokens[start + offset]?.key === key),
      );
      if (found) {
        result.fill("COUNTRY", start, start + found.keys.length);
        start += found.keys.length - 1;
      }
    }
    return result;
  },
};
export default recipe;
