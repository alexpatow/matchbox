import { milliseconds, type TimingResult } from "./types";
export function BenchmarkResults({ result, testId }: { result: TimingResult; testId: string }) {
  return (
    <div className="benchmark-results" data-testid={testId} data-report={JSON.stringify(result)}>
      <dl className="timing-metrics">
        <div>
          <dt>Median / p50</dt>
          <dd>
            {milliseconds(result.p50Ms)}
            <span>ms</span>
          </dd>
        </div>
        <div>
          <dt>95th percentile</dt>
          <dd>
            {milliseconds(result.p95Ms)}
            <span>ms</span>
          </dd>
        </div>
        <div>
          <dt>Accepted parses</dt>
          <dd className="accepted-count">
            {result.accepted}
            <span>/ {result.samples}</span>
          </dd>
        </div>
      </dl>
      {!!result.candidates?.length && (
        <details className="baseline-comparison">
          <summary>Compare with the rule baseline</summary>
          <table>
            <thead>
              <tr>
                <th scope="col">Parser</th>
                <th scope="col">Median</th>
                <th scope="col">p95</th>
                <th scope="col">Accepted</th>
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
            Both parsers receive the same three queries. Acceptance measures returned answers, not
            correctness.
          </p>
        </details>
      )}
    </div>
  );
}
