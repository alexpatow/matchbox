import { countries } from "@/countries";
import type { Filter, Clause } from "@/filter";
const operators = { eq: "=", neq: "≠", gt: ">", gte: "≥", lt: "<", lte: "≤" };
function label(clause: Clause) {
  const value =
    clause.field === "country"
      ? countries[clause.value].name
      : clause.field === "arr"
        ? clause.value.toLocaleString("en-US")
        : clause.value;
  return `${clause.field === "arr" ? "ARR" : clause.field} ${operators[clause.operator]} ${value}`;
}
export function FilterChips({ filter }: { filter: Filter }) {
  const groups = "or" in filter ? filter.or : [filter];
  return (
    <div className="filter-chips" aria-label="Parsed filters">
      {groups.map((group, i) => (
        <span className="filter-group" key={i}>
          {i > 0 && <span className="join">OR</span>}
          {("and" in group ? group.and : [group]).map((clause, j) => (
            <span className="filter-part" key={j}>
              {j > 0 && <span className="join">AND</span>}
              <span className="filter-chip">{label(clause)}</span>
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
