import { countryAliases, normalizeCountry } from "../lib/countries";
import { tokenize } from "@matchbox-ai/core/internal";
import { compileClauses, type Predicate, type MatchboxParser } from "@matchbox-ai/core/runtime";
import task, { type Filter } from "../parser.js";
function recognize(text: string): { value: Predicate | null; confidence: number } {
  const lower = text
    .toLowerCase()
    .replace(
      /\b(show|find|customers|accounts|companies|that|are|currently|with|is|have|status)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
  let value: Predicate | null = null;
  const status = lower.match(/^(?:(not|exclude|except|without) )?(active|inactive|churned)$/);
  const country = normalizeCountry(lower.replace(/^(?:based in|in|from|country) /, ""));
  const money = lower.match(
    /^(?:arr|annual recurring revenue|revenue) (over|above|greater than|more than|under|below|less than|at least|no less than|greater than or equal to|at most|no more than|less than or equal to|exactly|equal to|>=|<=|>|<|=) [$€]?(\d[\d,]*(?:\.\d+)?)(k|m)?$/,
  );
  if (status) value = { field: "status", operator: status[1] ? "neq" : "eq", value: status[2]! };
  if (country) value = { field: "country", operator: "eq", value: country };
  if (money)
    value = {
      field: "arr",
      operator: (
        {
          over: "gt",
          above: "gt",
          "greater than": "gt",
          "more than": "gt",
          "less than": "lt",
          "no less than": "gte",
          "greater than or equal to": "gte",
          "no more than": "lte",
          "less than or equal to": "lte",
          "equal to": "eq",
          under: "lt",
          below: "lt",
          "at least": "gte",
          "at most": "lte",
          exactly: "eq",
          ">": "gt",
          "<": "lt",
          ">=": "gte",
          "<=": "lte",
          "=": "eq",
        } as Record<string, string>
      )[money[1]!]!,
      value:
        Number(money[2]!.replaceAll(",", "")) *
        (money[3] === "k" ? 1000 : money[3] === "m" ? 1000000 : 1),
    };
  return { value, confidence: value ? 1 : 0 };
}
const baseline: MatchboxParser<Filter> = {
  async parse(input) {
    const tokens = tokenize(input, "words");
    const masked = input.split("");
    for (let start = 0; start < tokens.length; start++) {
      const match = countryAliases.find(
        ({ keys, alias, isCode }) =>
          (!isCode || tokens[start]?.text === alias) &&
          keys.every((key, offset) => tokens[start + offset]?.key === key),
      );
      if (match) {
        for (let i = tokens[start]!.start; i < tokens[start + match.keys.length - 1]!.end; i++)
          masked[i] = "_";
        start += match.keys.length - 1;
      }
    }
    const text = masked.join("");
    let cursor = 0;
    const candidate = compileClauses(text, (clause) => {
      const start = text.indexOf(clause, cursor);
      cursor = start + clause.length;
      return recognize(input.slice(start, cursor));
    });
    const result = task.validateOutput(candidate.value);
    return result.success
      ? { status: "ok", confidence: 1, value: result.data }
      : { status: "uncertain", confidence: 0, value: null, reason: "No rule matched." };
  },
};
export default baseline;
