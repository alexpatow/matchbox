import { useEffect, useState } from "react";
import { useMatchbox } from "@matchbox-ai/core/react";
import type { ParseResult } from "@matchbox-ai/core/runtime";
import { BenchmarkPanel } from "@/benchmark";
import { Button } from "@/components/ui/button";
import { measure } from "./measure.js";
import type { ExampleLoader, TrainingReport } from "./types.js";
interface Props {
  name: string;
  title: string;
  inputLabel: string;
  description: string;
  suggestions: string[];
  load: ExampleLoader;
}
export function ModelExample({ name, title, inputLabel, description, suggestions, load }: Props) {
  const { parse, status, error } = useMatchbox(load);
  const [query, setQuery] = useState(suggestions[0]!);
  const [result, setResult] = useState<ParseResult<unknown> | null>(null);
  const [report, setReport] = useState<TrainingReport | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    load()
      .then((module) => {
        if (current) setReport(module.report);
      })
      .catch((cause) => {
        if (current) setFailure(String(cause));
      });
    return () => {
      current = false;
    };
  }, [load]);
  useEffect(() => {
    let current = true;
    parse(query)
      .then((value) => {
        if (current) setResult(value);
      })
      .catch((cause) => {
        if (current) setFailure(String(cause));
      });
    return () => {
      current = false;
    };
  }, [parse, query]);
  function update(value: string) {
    setQuery(value);
    setResult(null);
    setFailure(null);
  }
  return (
    <section className="query-section training-example" aria-labelledby={`${name}-title`}>
      <h2 id={`${name}-title`}>{title}</h2>
      <p className="description">{description}</p>
      {report && (
        <p className="training-metrics">
          {report.parameters.toLocaleString()} parameters · {(report.bytes / 1024).toFixed(1)} KiB ·{" "}
          {report.examples.train.toLocaleString()} training examples ·{" "}
          {(report.quantized.exactAccuracy * 100).toFixed(0)}% on {report.examples.eval} eval
          examples
        </p>
      )}
      <label htmlFor={name}>{inputLabel}</label>
      <input
        id={name}
        value={query}
        onChange={(event) => update(event.target.value)}
        autoComplete="off"
        aria-describedby={`${name}-status`}
      />
      <div className="suggestions">
        {suggestions.map((value) => (
          <Button variant="secondary" key={value} onClick={() => update(value)}>
            {value}
          </Button>
        ))}
      </div>
      <output id={`${name}-status`} className="parse-status" aria-live="polite">
        {failure ||
          error ||
          (status === "loading"
            ? "Loading the trained model…"
            : result?.status === "ok"
              ? "Parsed locally from trained weights."
              : result?.status === "uncertain"
                ? `Uncertain. ${result.reason}`
                : "Parsing…")}
      </output>
      <pre aria-label={`${name} output`}>
        <code>
          {result ? JSON.stringify(result, null, 2) : "Preparing the model on your device…"}
        </code>
      </pre>
      <details className="developer-details">
        <summary>Inspect training</summary>
        {report && (
          <p>
            Training loss fell from {report.loss[0]?.toFixed(4)} to {report.loss.at(-1)?.toFixed(6)}
            . Before training, ungated exact accuracy was{" "}
            {(report.untrainedUngated.exactAccuracy * 100).toFixed(0)}%.
          </p>
        )}
        <pre>
          <code>{`import model from "./${name}.matchbox";\nconst result = await model.parse(input);`}</code>
        </pre>
        <p>Confidence is an uncalibrated model score.</p>
      </details>
      <BenchmarkPanel
        key={query}
        run={() => measure({ parse }, query)}
        ready={status === "ready"}
        buttonLabel={`Measure ${name}`}
        testId={`${name}-timing`}
      />
    </section>
  );
}
