import type { Filter, Clause } from "../../../../examples/filters/matchbox/filters/parser.js";
import type { Customer } from "./customers.js";
function matchesClause(customer: Customer, clause: Clause): boolean {
  const value = customer[clause.field];
  switch (clause.operator) {
    case "eq":
      return value === clause.value;
    case "neq":
      return value !== clause.value;
    case "gt":
      return customer.arr > clause.value;
    case "gte":
      return customer.arr >= clause.value;
    case "lt":
      return customer.arr < clause.value;
    case "lte":
      return customer.arr <= clause.value;
  }
}
export function matchesFilter(customer: Customer, filter: Filter): boolean {
  if ("or" in filter) {
    return filter.or.some((node) => matchesFilter(customer, node));
  }
  if ("and" in filter) {
    return filter.and.every((clause) => matchesClause(customer, clause));
  }
  return matchesClause(customer, filter);
}
