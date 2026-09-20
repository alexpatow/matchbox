import type { Operation, Metrics } from "./index";
export function OperationReport({ report }: { report: Operation }) {
  let metrics: Metrics | null | undefined = null;
  if (report.command === "train") {
    metrics = report.result.evaluation;
  } else if (report.command === "eval") {
    metrics = report.result as Metrics;
  }
  let title = report.ok ? "Run complete." : "Evaluation threshold not met.";
  if (report.command === "save") {
    title = "Training example saved.";
  } else if (report.command === "inspect") {
    title = "Recognition details";
  }
  return (
    <section className="report" aria-live="polite">
      <h2>{title}</h2>
      {metrics ? (
        <>
          <dl>
            <div>
              <dt>Exact answers</dt>
              <dd>{(metrics.exactAccuracy * 100).toFixed(1)}%</dd>
            </div>
            <div>
              <dt>Uncertain answers</dt>
              <dd>{(metrics.abstentionRate * 100).toFixed(1)}%</dd>
            </div>
            <div>
              <dt>Invalid outputs</dt>
              <dd>{(metrics.invalidOutputRate * 100).toFixed(1)}%</dd>
            </div>
          </dl>
          <p>
            Measured against {metrics.examples} independent test examples.
            {report.result.bytes ? ` Artifact: ${report.result.bytes.toLocaleString()} bytes.` : ""}
          </p>
          {metrics.failures.map((failure, index) => (
            <div className="failure" key={index}>
              <strong>
                {typeof failure.input === "string" ? failure.input : JSON.stringify(failure.input)}
              </strong>
              <pre>
                Expected: {JSON.stringify(failure.expected)}
                {"\n"}Actual: {JSON.stringify(failure.actual)}
              </pre>
            </div>
          ))}
        </>
      ) : null}
      {!metrics && report.command === "save" && <p>{report.result.next}</p>}
      {!metrics && report.command !== "save" && <pre>{JSON.stringify(report.result, null, 2)}</pre>}
    </section>
  );
}
