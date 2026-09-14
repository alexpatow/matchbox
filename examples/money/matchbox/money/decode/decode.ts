import type { SequenceDecoder } from "@matchbox-ai/core/runtime";
import { normalizeNumber } from "./number-words";
const decode: SequenceDecoder = (tokens, input) => {
  if (tokens.some((token) => token.label === "REJECT")) {
    return null;
  }
  const amounts = tokens.filter((token) => token.label === "AMOUNT");
  if (!amounts.length) {
    return null;
  }
  const first = tokens.indexOf(amounts[0]!);
  if (amounts.some((token, index) => tokens[first + index] !== token)) {
    return null;
  }
  const amount = normalizeNumber(input.slice(amounts[0]!.start, amounts.at(-1)!.end));
  const currencies = new Set(
    tokens
      .filter((token) => ["EUR", "USD", "GBP", "SEK"].includes(token.label))
      .map((token) => token.label),
  );
  const scales = tokens.filter((token) => token.label === "THOUSAND" || token.label === "MILLION");
  if (amount === null || currencies.size !== 1 || scales.length > 1) {
    return null;
  }
  let scale = 1;
  if (scales[0]?.label === "THOUSAND") {
    scale = 1000;
  } else if (scales[0]?.label === "MILLION") {
    scale = 1_000_000;
  }
  const cents = Math.round(amount * 100) * scale;
  if (!Number.isSafeInteger(cents) || cents < 0) {
    return null;
  }
  return {
    amount: cents / 100,
    currency: [...currencies][0],
    approximate: tokens.some((token) => token.label === "APPROX"),
  };
};
export default decode;
