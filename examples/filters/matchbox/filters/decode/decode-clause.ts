import { normalizeCountry } from "../countries/normalize";
import type { TaggedToken, Predicate } from "@matchbox-ai/core/runtime";
export function decodeClause(tokens: readonly TaggedToken[]): Predicate | null {
  const labels = new Set(tokens.map((token) => token.label));
  const statuses = [...labels].filter((label) => label.startsWith("STATUS_"));
  const countryTokens = tokens.filter((token) => token.label === "COUNTRY");
  const country = normalizeCountry(countryTokens.map((token) => token.text).join(" "));
  const amounts = tokens.filter((token) => token.label === "AMOUNT");
  if (
    Number(statuses.length > 0) + Number(countryTokens.length > 0) + Number(labels.has("ARR")) !==
    1
  )
    return null;
  const negate = labels.has("NEGATE");
  if (statuses.length === 1 && !amounts.length) {
    // This initial dataset teaches exclusion of churned status only.
    const value = statuses[0]!.slice(7);
    return negate && value !== "churned"
      ? null
      : { field: "status", operator: negate ? "neq" : "eq", value };
  }
  if (country !== null && !amounts.length && !negate)
    return { field: "country", operator: "eq", value: country };
  if (!labels.has("ARR") || amounts.length !== 1 || negate) return null;
  const text = amounts[0]!.text;
  if (!/^(?:\d+(?:\.\d+)?|\d{1,3}(?:,\d{3})+(?:\.\d+)?)$/.test(text)) return null;
  if (labels.has("THOUSAND") && labels.has("MILLION")) return null;
  const value =
    Number(text.replaceAll(",", "")) *
    (labels.has("THOUSAND") ? 1000 : labels.has("MILLION") ? 1_000_000 : 1);
  if (!Number.isFinite(value)) return null;
  if (labels.has("GT") && labels.has("LT")) return null;
  let operator = labels.has("GTE")
    ? "gte"
    : labels.has("LTE")
      ? "lte"
      : labels.has("GT")
        ? "gt"
        : labels.has("LT")
          ? "lt"
          : labels.has("EQUAL")
            ? "eq"
            : null;
  if (labels.has("EQUAL") && operator === "gt") operator = "gte";
  if (labels.has("EQUAL") && operator === "lt") operator = "lte";
  if (labels.has("INVERT")) operator = operator === "lt" ? "gte" : operator === "gt" ? "lte" : null;
  return operator ? { field: "arr", operator, value } : null;
}
