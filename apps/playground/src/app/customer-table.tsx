import type { Customer } from "@/filter";
export function CustomerTable({ rows }: { rows: Customer[] }) {
  return (
    <div className="table-scroll">
      <table>
        <caption>
          {rows.length} {rows.length === 1 ? "customer" : "customers"}
        </caption>
        <thead>
          <tr>
            <th scope="col">Company</th>
            <th scope="col">Country</th>
            <th scope="col">Status</th>
            <th scope="col">ARR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">{row.name}</th>
              <td>{row.country}</td>
              <td>{row.status}</td>
              <td>€{row.arr.toLocaleString("en-US")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="empty">No customers match these filters.</p>}
    </div>
  );
}
