import type { TaggedToken, Predicate, FilterExpression } from "@matchbox-ai/core/runtime";
import { decodeClause } from "./decode-clause";
import { normalizeCountry } from "../countries/normalize";
/** Application grammar: adjacent fields imply AND; adjacent country alternatives share later constraints. */
export function implicit(tokens: readonly TaggedToken[]): FilterExpression | null {
  // This fallback only handles implicit conjunctions and adjacent country alternatives.
  // Explicit boolean clauses belong to compileClauses; never salvage a partial clause.
  for (const [i, token] of tokens.entries()) {
    if (token.label !== "O") {
      continue;
    }
    if (token.key === "and") {
      return null;
    }
    if (token.key === "or") {
      const before = tokens
        .slice(0, i)
        .filter((t) => t.label !== "O")
        .at(-1);
      const after = tokens.slice(i + 1).find((t) => t.label !== "O");
      if (before?.label !== "COUNTRY" || after?.label !== "COUNTRY") {
        return null;
      }
    }
  }
  const statuses: Predicate[] = [];
  const countries: Predicate[] = [];
  const numeric: TaggedToken[] = [];
  let negate = false;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (token.label === "REJECT") {
      return null;
    }
    if (token.label === "NEGATE") {
      negate = true;
      continue;
    }
    if (token.label.startsWith("STATUS_")) {
      statuses.push({
        field: "status",
        operator: negate ? "neq" : "eq",
        value: token.label.slice(7),
      });
      negate = false;
    } else if (token.label === "COUNTRY") {
      const span = [token.text];
      while (tokens[i + 1]?.label === "COUNTRY") {
        span.push(tokens[++i]!.text);
      }
      const code = normalizeCountry(span.join(" "));
      if (!code) {
        return null;
      }
      countries.push({ field: "country", operator: negate ? "neq" : "eq", value: code });
      negate = false;
    } else if (!["O"].includes(token.label)) {
      numeric.push(token);
    }
  }
  if (negate || statuses.length > 1) {
    return null;
  }
  if (numeric.length && !numeric.some((t) => t.label === "ARR")) {
    numeric.push({ ...numeric[0]!, label: "ARR" });
  }
  const amount = numeric.length ? decodeClause(numeric) : null;
  if (numeric.length && !amount) {
    return null;
  }
  const constraints = [...statuses, ...(amount ? [amount] : [])];
  if (!countries.length && !constraints.length) {
    return null;
  }
  if (countries.length > 1 && !tokens.some((t) => t.key === "or")) {
    return null;
  }
  const node = (items: Predicate[]): Predicate | { and: Predicate[] } =>
    items.length === 1 ? items[0]! : { and: items };
  if (countries.length > 1) {
    return { or: countries.map((country) => node([country, ...constraints])) };
  }
  // Preserve textual field order for the common status / country / amount form.
  return node([...statuses, ...countries, ...(amount ? [amount] : [])]);
}
