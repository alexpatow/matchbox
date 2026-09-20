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
    const timer = setTimeout(() => {
      benchmark().then(
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
      <details>
        <summary>Measurement details</summary>
        <p>Model artifact only; the shared runtime is an additional download.</p>
        <p>
          Latency on this device includes parsing and validation, excluding model loading and
          rendering. We warm up with 20 calls, then time 300 calls across three sample queries. Half
          finish within the median; 95% finish within p95. This measures speed, not accuracy.
        </p>
        {result && (
          <p>
            {result.accepted} of {result.samples} calls returned a validated answer.
          </p>
        )}
      </details>
    </div>
  );
}
