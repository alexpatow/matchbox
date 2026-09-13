import { tokenize, type MatchboxParser } from "@matchbox-ai/core/runtime";
import { decode, normalizeNumber } from "./src";
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
                : ["between", "or", "under", "over"].includes(token.key)
                  ? "REJECT"
                  : "O"),
    }));
    const value = decode(tokens, input);
    return value === null
      ? { status: "uncertain", value: null, confidence: 0, reason: "Unsupported expression." }
      : { status: "ok", value, confidence: 1 };
  },
};
export default baseline;
