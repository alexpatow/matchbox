import { type MatchboxParser } from "@matchbox-ai/core/runtime";
import { tokenize } from "@matchbox-ai/core/internal";
import task from "../parser";
import decode from "../decode/decode";
import { quantity } from "../decode/quantity";
// The same output compiler, with explicit lexical recognition instead of learned labels.
const units: Record<string, string> = {
  second: "SECOND",
  seconds: "SECOND",
  minute: "MINUTE",
  minutes: "MINUTE",
  hour: "HOUR",
  hours: "HOUR",
  day: "DAY",
  days: "DAY",
};
const labels: Record<string, string> = {
  today: "TODAY",
  tomorrow: "TOMORROW",
  am: "AM",
  pm: "PM",
  ":": "COLON",
  in: "RELATIVE",
  for: "DURATION",
  or: "REJECT",
  not: "REJECT",
  never: "REJECT",
  without: "REJECT",
  ago: "REJECT",
  months: "REJECT",
  weeks: "REJECT",
  years: "REJECT",
  business: "REJECT",
  negative: "REJECT",
};
const baseline: MatchboxParser<unknown> = {
  async parse(input) {
    const tokens = tokenize(input, "words");
    const isClock = tokens.some((token) => ["today", "tomorrow"].includes(token.key));
    const tagged = tokens.map((token) => ({
      ...token,
      confidence: 1,
      label:
        labels[token.key] ??
        units[token.key] ??
        (quantity(token.text) !== null ? (isClock ? "CLOCK" : "AMOUNT") : "O"),
    }));
    const result = task.validateOutput(decode(tagged, input));
    return result.success
      ? { status: "ok", value: result.data, confidence: 1 }
      : {
          status: "uncertain",
          value: null,
          confidence: 0,
          reason: "No unambiguous supported expression.",
        };
  },
};
export default baseline;
