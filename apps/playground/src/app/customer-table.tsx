import type { Customer } from "@/filter";
export function CustomerTable({ rows }: { rows: Customer[] }) {
  return (
    <div className="table-scroll">
      <table className="customer-table">
        <caption>
          {rows.length} {rows.length === 1 ? "customer" : "customers"}
        </caption>
        <thead>
          <tr>
            <th scope="col">Company</th>
            <th scope="col" className="customer-detail">
              Country
            </th>
            <th scope="col" className="customer-detail">
              Status
            </th>
            <th scope="col">ARR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">
                {row.name}
                <span className="customer-summary">
                  <span aria-label="Country">{row.country}</span>
                  <span aria-hidden="true"> · </span>
                  <span aria-label="Status">{row.status}</span>
                </span>
              </th>
              <td className="customer-detail">{row.country}</td>
              <td className="customer-detail">{row.status}</td>
              <td>€{row.arr.toLocaleString("en-US")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="empty">No customers match these filters.</p>}
    </div>
  );
}
