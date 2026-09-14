import { type MatchboxParser } from "@matchbox-ai/core/runtime";
import { tokenize } from "@matchbox-ai/core/internal";
import task from "../parser";
import decode from "../decode/decode";
import { normalizeNumber } from "../decode/number-words";
const currency: Record<string, string> = {
  "€": "EUR",
  $: "USD",
  eur: "EUR",
  euro: "EUR",
  euros: "EUR",
  usd: "USD",
  dollars: "USD",
  dollar: "USD",
  "£": "GBP",
  gbp: "GBP",
  pounds: "GBP",
  pound: "GBP",
  sek: "SEK",
  kronor: "SEK",
};
const baseline: MatchboxParser<unknown> = {
  async parse(input) {
    const tokens = tokenize(input, "words").map((token) => ({
      ...token,
      confidence: 1,
      label:
        currency[token.key] ??
        (normalizeNumber(token.text) !== null
          ? "AMOUNT"
          : ["k", "grand", "thousand"].includes(token.key)
            ? "THOUSAND"
            : ["m", "million"].includes(token.key)
              ? "MILLION"
              : ["about", "around", "roughly"].includes(token.key)
                ? "APPROX"
                : [
                      "between",
                      "and",
                      "or",
                      "under",
                      "over",
                      "not",
                      "never",
                      "without",
                      "minus",
                      "hundred",
                    ].includes(token.key)
                  ? "REJECT"
                  : "O"),
    }));
    // Associate amounts with the closest currency, rather than treating invoice IDs as money.
    const amounts: number[][] = [];
    tokens.forEach((token, i) => {
      if (token.label !== "AMOUNT") return;
      if (amounts.at(-1)?.at(-1) === i - 1) amounts.at(-1)!.push(i);
      else amounts.push([i]);
    });
    const selected = new Set<number>();
    tokens.forEach((token, i) => {
      if (!["EUR", "USD", "GBP", "SEK"].includes(token.label) || !amounts.length) return;
      const distances = amounts.map((group) => Math.min(...group.map((j) => Math.abs(i - j))));
      const minimum = Math.min(...distances);
      if (distances.filter((d) => d === minimum).length !== 1) return;
      amounts[distances.indexOf(minimum)]!.forEach((j) => selected.add(j));
    });
    tokens.forEach((token, i) => {
      if (token.label === "AMOUNT" && !selected.has(i)) token.label = "O";
    });
    const value = decode(tokens, input);
    const validated = task.validateOutput(value);
    return !validated.success
      ? { status: "uncertain", value: null, confidence: 0, reason: "Unsupported expression." }
      : { status: "ok", value: validated.data, confidence: 1 };
  },
};
export default baseline;
