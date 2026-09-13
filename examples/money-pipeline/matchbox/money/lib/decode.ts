import type { SequenceDecoder } from "@matchbox-ai/core/runtime";
import { normalizeNumber } from "./index.js";
const decode: SequenceDecoder = (tokens, input) => {
  const amounts = tokens.filter((token) => token.label === "AMOUNT");
  if (!amounts.length) return null;
  const first = tokens.indexOf(amounts[0]!);
  if (amounts.some((token, index) => tokens[first + index] !== token)) return null;
  const amount = normalizeNumber(input.slice(amounts[0]!.start, amounts.at(-1)!.end));
  const currencies = new Set(
    tokens
      .filter((token) => ["EUR", "USD", "GBP", "SEK"].includes(token.label))
      .map((token) => token.label),
  );
  const scales = tokens.filter((token) => token.label === "THOUSAND" || token.label === "MILLION");
  if (amount === null || currencies.size !== 1 || scales.length > 1) return null;
  const scale =
    scales[0]?.label === "THOUSAND" ? 1000 : scales[0]?.label === "MILLION" ? 1_000_000 : 1;
  const cents = Math.round(amount * 100) * scale;
  if (!Number.isSafeInteger(cents) || cents < 0) return null;
  return {
    amount: cents / 100,
    currency: [...currencies][0],
    approximate: tokens.some((token) => token.label === "APPROX"),
  };
};
export default decode;
