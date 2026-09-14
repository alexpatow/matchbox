import { useEffect, useState } from "react";
import type { MatchboxParser, ParseResult } from "@matchbox-ai/core/runtime";
import { Correction } from "./index";
export function ModelLab({
  revision,
  ready,
  busy,
  run,
}: {
  revision: number;
  ready: boolean;
  busy: boolean;
  run: (command: string, data?: object) => Promise<void>;
}) {
  const [parser, setParser] = useState<MatchboxParser<unknown> | null>(null);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ParseResult<unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timing, setTiming] = useState<number[] | null>(null);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!ready) return;
    let current = true;
    let model: (MatchboxParser<unknown> & { dispose?(): void }) | undefined;
    void import(/* @vite-ignore */ `/__matchbox/model.ts?v=${revision}`)
      .then(async (module) => {
        model = module.default;
        await model!.load?.();
        if (current) setParser(model!);
        else model?.dispose?.();
      })
      .catch((cause) => {
        if (current) setError(String(cause));
      });
    return () => {
      current = false;
      model?.dispose?.();
    };
  }, [revision, ready]);
  async function predict(measure = false) {
    if (!parser) return;
    setRunning(true);
    setError(null);
    try {
      const value = await parser.parse(input);
      setResult(value);
      if (measure) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        for (let i = 0; i < 20; i++) await parser.parse(input);
        const times: number[] = [];
        for (let i = 0; i < 100; i++) {
          const start = performance.now();
          await parser.parse(input);
          times.push(performance.now() - start);
        }
        times.sort((a, b) => a - b);
        setTiming([times[49]!, times[94]!]);
      }
    } catch (cause) {
      setError(String(cause));
    } finally {
      setRunning(false);
    }
  }
  return (
    <section className="lab">
      <div className="input-pane">
        <h2>Try an input.</h2>
        <label htmlFor="input">Input</label>
        <textarea
          id="input"
          value={input}
          placeholder="Enter an example for your task."
          disabled={running}
          onChange={(event) => {
            setInput(event.target.value);
            setResult(null);
            setTiming(null);
          }}
        />
        <div className="actions">
          <button
            className="primary"
            disabled={!parser || busy || running || !input.trim()}
            onClick={() => void predict()}
          >
            Predict
          </button>
          <button
            disabled={!parser || busy || running || !input.trim()}
            onClick={() => void predict(true)}
          >
            Measure browser speed
          </button>
        </div>
        {timing && (
          <p className="timing">
            Typical: <strong>{timing[0]!.toFixed(2)} ms</strong> · 95% finished within{" "}
            <strong>{timing[1]!.toFixed(2)} ms</strong>.<br />
            100 runs of this input after 20 warmups. Loading is excluded.
          </p>
        )}
        <Correction
          key={input + JSON.stringify(result)}
          input={input}
          result={result}
          disabled={busy || running || !input.trim()}
          run={run}
        />
      </div>
      <div className="output-pane">
        <h2>See the prediction.</h2>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {result ? (
          <>
            <p>
              {result.status === "ok" ? "Validated output" : "Uncertain"} · Confidence{" "}
              {result.confidence.toFixed(2)}
            </p>
            <pre>{JSON.stringify(result.status === "ok" ? result.value : result, null, 2)}</pre>
            <p className="muted">Confidence is an uncalibrated model score.</p>
            <button disabled={busy || running} onClick={() => void run("inspect", { input })}>
              Inspect recognition
            </button>
          </>
        ) : (
          <p className="muted">
            {ready && !parser
              ? "Loading the model in your browser…"
              : "Run a prediction to see validated output or uncertainty."}
          </p>
        )}
      </div>
    </section>
  );
}
