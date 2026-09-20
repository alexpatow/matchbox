import { useState } from "react";
import { Button } from "@/components/ui/button";
import { benchmark } from "@/filter";
import { milliseconds, type TimingResult } from "@/benchmark";
import { bytes } from "../../../../examples/filters/.matchbox/filters/report.json";

export function FilterPerformance({ ready }: { ready: boolean }) {
  const [result, setResult] = useState<TimingResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function measure() {
    setRunning(true);
    setError(null);
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
      setResult(await benchmark());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="filter-performance">
      <div className="filter-measurements">
        <span className="filter-model-size">{(bytes / 1024).toFixed(1)} KiB model</span>
        <Button variant="secondary" disabled={!ready || running} onClick={measure}>
          {running ? "Measuring…" : "Measure latency"}
        </Button>
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
