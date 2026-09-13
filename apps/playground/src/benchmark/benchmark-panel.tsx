import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BenchmarkResults } from "./benchmark-results";
import type { TimingResult } from "./types";
interface Props {
  run: () => Promise<TimingResult>;
  ready: boolean;
  buttonLabel: string;
  testId: string;
  featured?: boolean;
}
export function BenchmarkPanel({ run, ready, buttonLabel, testId, featured = false }: Props) {
  const [result, setResult] = useState<TimingResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <section
      id={featured ? "benchmark" : undefined}
      className={`benchmark-panel ${featured ? "benchmark-featured" : ""}`}
      aria-label="Browser benchmark"
    >
      <div className="benchmark-heading">
        <div>
          <p className="benchmark-kicker">Measured on your device</p>
          <h3>{featured ? "Measure local inference." : "Browser performance"}</h3>
        </div>
        <Button
          className="benchmark-run"
          disabled={!ready || running}
          onClick={async () => {
            setRunning(true);
            setError(null);
            try {
              await new Promise<void>((resolve) =>
                requestAnimationFrame(() => setTimeout(resolve, 0)),
              );
              setResult(await run());
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : String(cause));
            } finally {
              setRunning(false);
            }
          }}
        >
          <span className="benchmark-icon" aria-hidden="true">
            {running ? "◌" : "▷"}
          </span>
          {running ? "Measuring…" : buttonLabel}
        </Button>
      </div>
      {error && (
        <p className="benchmark-error" role="alert">
          {error}
        </p>
      )}
      {result ? (
        <BenchmarkResults result={result} testId={testId} />
      ) : (
        <div className="benchmark-empty">
          <span className="benchmark-workload">
            300<span>parses</span>
          </span>
          <p>
            Measure median and p95 inference times.
            <br />
            Results come from this device.
          </p>
        </div>
      )}
      <p className="benchmark-method">
        {running && "Running 20 warmups and 300 timed parses."}
        {!running &&
          (featured
            ? "Three sample queries, 20 warmups, 300 timed parses. Includes validation; excludes model loading and rendering."
            : "Uses the current input: 20 warmups, then 300 timed parses. Excludes model loading and rendering.")}
      </p>
    </section>
  );
}
