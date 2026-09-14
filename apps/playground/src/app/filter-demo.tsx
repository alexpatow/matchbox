import { useEffect, useState } from "react";
import { useMatchbox } from "@matchbox-ai/core/react";
import type { ParseResult } from "@matchbox-ai/core/runtime";
import { BenchmarkPanel } from "@/benchmark";
import { Button } from "@/components/ui/button";
import { customers, matchesFilter, loadFilters, benchmark, type Filter } from "@/filter";
import { CustomerTable } from "./customer-table";
import { FilterChips } from "./filter-chips";
const suggestions = [
  "active customers and Swedish customers and ARR over 50k",
  "German customers or Swedish customers",
  "ARR at least 75k and not churned",
];
export function FilterDemo() {
  const { parse, status, error: loadError } = useMatchbox(loadFilters);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ParseResult<Filter> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    if (query.trim())
      parse(query)
        .then((value) => {
          if (current) setResult(value);
        })
        .catch((cause) => {
          if (current) setError(String(cause));
        });
    return () => {
      current = false;
    };
  }, [query, parse]);
  function updateQuery(value: string) {
    setQuery(value);
    setResult(null);
    setError(null);
  }
  const rows =
    result?.status === "ok"
      ? customers.filter((row) => matchesFilter(row, result.value))
      : customers;
  return (
    <section id="demo" className="demo" aria-labelledby="demo-title">
      <div className="section-heading">
        <h2 id="demo-title">Customer filters</h2>
        <p>Type a query to filter the table locally.</p>
      </div>
      <section className="query-section" aria-labelledby="query-label">
        <label id="query-label" htmlFor="query">
          Filter customers
        </label>
        <input
          id="query"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder="Try active customers and ARR over 50k"
          aria-describedby="query-help"
          autoComplete="off"
        />
        <p id="query-help">
          Join clauses with “and” or “or”. Dates and implicit joins are not supported yet.
        </p>
        <div className="suggestions">
          {suggestions.map((suggestion) => (
            <Button variant="secondary" key={suggestion} onClick={() => updateQuery(suggestion)}>
              {suggestion}
            </Button>
          ))}
        </div>
        <output
          className="parse-status"
          data-loading={status === "loading" || (!!query.trim() && !result && !error && !loadError)}
          aria-live="polite"
        >
          {error ||
            loadError ||
            (status === "loading"
              ? "Preparing the model on your device…"
              : !query.trim()
                ? "The model is ready. All customers are shown."
                : !result
                  ? "Parsing…"
                  : result.status === "ok"
                    ? `Parsed locally. Confidence score: ${result.confidence.toFixed(2)}.`
                    : "Uncertain. Try a supported example. All customers are shown.")}
        </output>
        {result?.status === "ok" && <FilterChips filter={result.value} />}
      </section>
      <CustomerTable rows={rows} />
      <details className="developer-details">
        <summary>Inspect the typed output</summary>
        <pre>
          <code>
            {
              'import filters from "./filters.matchbox";\nconst result = await filters.parse(input);'
            }
          </code>
        </pre>
        <pre aria-label="Parser output">
          <code>
            {result ? JSON.stringify(result, null, 2) : "Your validated output will appear here."}
          </code>
        </pre>
        <p>Confidence is an uncalibrated model score.</p>
      </details>
      <BenchmarkPanel
        run={benchmark}
        ready={status === "ready"}
        buttonLabel="Measure this browser"
        testId="benchmark"
        featured
      />
    </section>
  );
}
