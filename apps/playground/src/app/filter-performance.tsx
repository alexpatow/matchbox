import { useEffect, useState } from "react";
import { benchmark } from "@/filter";
import { milliseconds, type TimingResult } from "@/benchmark";

export function FilterPerformance({ ready }: { ready: boolean }) {
  const [result, setResult] = useState<TimingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) {
      return;
    }
    let current = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      benchmark(controller.signal).then(
        (timing) => {
          if (current) {
            setResult(timing);
          }
        },
        (cause) => {
          if (current) {
            setError(cause instanceof Error ? cause.message : String(cause));
          }
        },
      );
    }, 0);
    return () => {
      current = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [ready]);

  return (
    <div className="filter-performance">
      <div className="filter-measurements">
        {!result && !error && <span>Measuring latency…</span>}
        {result && (
          <output aria-live="polite" data-testid="benchmark" data-report={JSON.stringify(result)}>
            {milliseconds(result.p50Ms)} ms median · {milliseconds(result.p95Ms)} ms p95
          </output>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
