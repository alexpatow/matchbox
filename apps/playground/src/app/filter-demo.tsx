import { useEffect, useState } from "react";
import { useMatchbox } from "@matchbox-ai/core/react";
import type { ParseResult } from "@matchbox-ai/core/runtime";
import { FilterPerformance } from "./filter-performance";
import { Button } from "@/components/ui/button";
import { customers, matchesFilter, loadFilters, type Filter } from "@/filter";
import { FilterResults } from "./filter-results";
import { FilterChips } from "./filter-chips";
const suggestions = [
  "active Swedish customers over 50k ARR",
  "German or Swedish customers under 50k except churned ones",
  "ARR at least 75k and not churned",
];
export function FilterDemo() {
  const { parse, status, error: loadError } = useMatchbox(loadFilters);
  const [query, setQuery] = useState(suggestions[0]!);
  const [result, setResult] = useState<ParseResult<Filter> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    if (query.trim()) {
      parse(query)
        .then((value) => {
          if (current) {
            setResult(value);
          }
        })
        .catch((cause) => {
          if (current) {
            setError(String(cause));
          }
        });
    }
    return () => {
      current = false;
    };
  }, [query, parse]);
  function updateQuery(value: string) {
    if (value === query) {
      return;
    }
    setQuery(value);
    setResult(null);
    setError(null);
  }
  function statusText() {
    if (status === "loading") {
      return "Preparing the model on your device…";
    }
    if (!query.trim()) {
      return "";
    }
    if (!result) {
      return "Parsing…";
    }
    if (result.status === "ok") {
      return "";
    }
    return "Uncertain. Try a supported example. All customers are shown.";
  }
  const message = error || loadError || statusText();
  const rows =
    result?.status === "ok"
      ? customers.filter((row) => matchesFilter(row, result.value))
      : customers;
  return (
    <section id="demo" className="demo" aria-labelledby="demo-title">
      <div className="section-heading">
        <h2 id="demo-title">Example: Turn a sentence into a filter.</h2>
        <p>This small model translates customer queries into typed filters in your browser.</p>
      </div>
      <div className="filter-demo-panel">
        <section className="query-section" aria-labelledby="query-label">
          <label id="query-label" htmlFor="query">
            Filter customers
          </label>
          <textarea
            rows={2}
            id="query"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Try active customers and ARR over 50k"
            aria-describedby="query-help"
            autoComplete="off"
          />
          <p id="query-help">Status, country and ARR. Try an example or write your own.</p>
          <div className="suggestions">
            {suggestions.map((suggestion) => (
              <Button
                variant="secondary"
                key={suggestion}
                aria-pressed={query === suggestion}
                onClick={() => updateQuery(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
          {message && (
            <output
              className="parse-status"
              data-loading={
                status === "loading" || (!!query.trim() && !result && !error && !loadError)
              }
              aria-live="polite"
            >
              {message}
            </output>
          )}
          {result?.status === "ok" && <FilterChips filter={result.value} />}
        </section>
        <FilterResults rows={rows} result={result} />
        <FilterPerformance ready={status === "ready"} />
      </div>
    </section>
  );
}
