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
          <h3>{"Time a prediction on your device."}</h3>
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
      <p className="benchmark-purpose">
        We time how long it takes to turn one input into structured data on your device.
      </p>
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
            300<span>timed runs</span>
          </span>
          <p>
            We repeat the {featured ? "same three sample queries" : "current input"} to measure
            typical and slower response times.
          </p>
        </div>
      )}
      <p className="benchmark-method">
        {running
          ? "Preparing with 20 untimed runs, then timing 300 runs."
          : "Times are per input, in milliseconds (1 ms = 1/1,000 second). Loading the model and drawing the UI are excluded."}
      </p>
      <details className="benchmark-procedure">
        <summary>What does this test measure?</summary>
        <p>
          We run the parser 20 times to warm it up, then time 300 calls, including output
          validation. Repeating a small set of inputs measures execution speed. It does not
          establish accuracy on unfamiliar inputs.
        </p>
        <p>
          “Answers returned” counts runs that produced a validated result instead of “uncertain”.
          Check accuracy separately with test inputs that have known correct answers.
        </p>
        {result?.inputs && (
          <>
            <p>Inputs repeated in this run:</p>
            <ul>
              {result.inputs.map((input) => (
                <li key={input}>
                  <code>{input}</code>
                </li>
              ))}
            </ul>
          </>
        )}
      </details>
    </section>
  );
}
