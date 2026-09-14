import { milliseconds, type TimingResult } from "./types";
export function BenchmarkResults({ result, testId }: { result: TimingResult; testId: string }) {
  return (
    <div className="benchmark-results" data-testid={testId} data-report={JSON.stringify(result)}>
      <dl className="timing-metrics">
        <div>
          <dt>Typical time per input</dt>
          <dd>
            {milliseconds(result.p50Ms)}
            <span>ms</span>
          </dd>
          <dd className="metric-help">
            Half of the timed runs took this long or less. Lower is faster.
          </dd>
        </div>
        <div>
          <dt>95% of runs finished within</dt>
          <dd>
            {milliseconds(result.p95Ms)}
            <span>ms</span>
          </dd>
          <dd className="metric-help">
            Up to 5% of runs took longer. This shows how the slower runs behaved.
          </dd>
        </div>
        <div>
          <dt>Answers returned</dt>
          <dd className="accepted-count">
            {result.accepted}
            <span>/ {result.samples}</span>
          </dd>
          <dd className="metric-help">
            {result.samples - result.accepted} runs returned “uncertain”. Answer correctness is
            checked separately in evals.
          </dd>
        </div>
      </dl>
    </div>
  );
}
