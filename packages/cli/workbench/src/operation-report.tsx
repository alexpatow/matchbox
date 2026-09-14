import type { Operation, Metrics } from "./index";
export function OperationReport({ report }: { report: Operation }) {
  const metrics =
    report.command === "train"
      ? report.result.quantized
      : report.command === "eval"
        ? (report.result as Metrics)
        : null;
  return (
    <section className="report" aria-live="polite">
      <h2>
        {report.command === "save"
          ? "Training example saved."
          : report.command === "inspect"
            ? "Recognition details"
            : report.ok
              ? "Run complete."
              : "Evaluation threshold not met."}
      </h2>
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
              <strong>{failure.input}</strong>
              <pre>
                Expected: {JSON.stringify(failure.expected)}
                {"\n"}Actual: {JSON.stringify(failure.actual)}
              </pre>
            </div>
          ))}
        </>
      ) : report.command === "save" ? (
        <p>{report.result.next}</p>
      ) : (
        <pre>{JSON.stringify(report.result, null, 2)}</pre>
      )}
    </section>
  );
}
