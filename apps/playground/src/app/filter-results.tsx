import { useState } from "react";
import type { ParseResult } from "@matchbox-ai/core/runtime";
import type { Customer, Filter } from "@/filter";
import { bytes } from "../../../../examples/filters/.matchbox/filters/report.json";
import { CustomerTable } from "./customer-table";

export function FilterResults({
  rows,
  result,
}: {
  rows: Customer[];
  result: ParseResult<Filter> | null;
}) {
  const [view, setView] = useState("customers");
  const tabs = ["customers", "output"];
  return (
    <div className="filter-results">
      <div className="filter-results-toolbar">
        <div role="tablist" aria-label="Filter results">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              id={`result-${tab}`}
              role="tab"
              aria-selected={view === tab}
              aria-controls={`panel-${tab}`}
              tabIndex={view === tab ? 0 : -1}
              onClick={() => setView(tab)}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                  event.preventDefault();
                  const next = tabs[1 - index]!;
                  setView(next);
                  document.getElementById(`result-${next}`)?.focus();
                }
              }}
            >
              {tab === "customers" ? "Customers" : "Model output"}
            </button>
          ))}
        </div>
        <span className="filter-model-size" title="Model artifact only; runtime is additional.">
          {(bytes / 1024).toFixed(1)} KiB model
        </span>
      </div>
      <div
        role="tabpanel"
        id="panel-customers"
        aria-labelledby="result-customers"
        hidden={view !== "customers"}
        tabIndex={0}
      >
        <CustomerTable rows={rows} />
      </div>
      <div
        role="tabpanel"
        id="panel-output"
        aria-labelledby="result-output"
        hidden={view !== "output"}
        tabIndex={0}
      >
        <pre aria-label="Parser output">
          <code>
            {result ? JSON.stringify(result, null, 2) : "Enter a query to see the model output."}
          </code>
        </pre>
        <p className="output-note">
          Confidence is uncalibrated; a valid output can still be wrong.
        </p>
      </div>
    </div>
  );
}
