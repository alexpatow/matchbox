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
      {!!result.candidates?.length && (
        <details className="baseline-comparison">
          <summary>Compare with a handwritten rule parser</summary>
          <table>
            <thead>
              <tr>
                <th scope="col">Parser</th>
                <th scope="col">Typical time</th>
                <th scope="col">95% finished within</th>
                <th scope="col">Answers</th>
              </tr>
            </thead>
            <tbody>
              {[{ ...result, algorithm: "TensorFlow model" }, ...result.candidates].map((row) => (
                <tr key={row.algorithm}>
                  <th scope="row">{row.algorithm === "rules" ? "Rule baseline" : row.algorithm}</th>
                  <td>{milliseconds(row.p50Ms)} ms</td>
                  <td>{milliseconds(row.p95Ms)} ms</td>
                  <td>
                    {row.accepted} / {row.samples}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            The rule parser uses handwritten patterns instead of learned weights. Both receive the
            same inputs. These timings compare speed; evals check which answers are correct.
          </p>
        </details>
      )}
    </div>
  );
}
