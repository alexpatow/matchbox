import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { LexerOutput } from "./lexer-output";
import { useLexer } from "./use-lexer";
import manifest from "./model-manifest.json";
import "./lexer.css";

const initial =
  "export function greet(name: string) {\n  // No language hint is sent to the model.\n  return `Hello, ${name}!`;\n}\n";
export function LexerDemo() {
  const [input, setInput] = useState(initial);
  const [gpu, setGpu] = useState(false);
  const prediction = useLexer(input, gpu);
  let status = "Loading or recognizing…";
  if (prediction?.error) {
    status = prediction.error;
  } else if (prediction?.result) {
    const { result, elapsed } = prediction;
    status = `${result.status} · ${elapsed.toFixed(2)} ms`;
    if (result.status === "uncertain") {
      status = `${status} · ${result.reason}`;
    }
  }
  return (
    <section className="lexer-demo" aria-labelledby="lexer-title">
      <div className="example-heading">
        <div>
          <h2 id="lexer-title">Syntax highlighting</h2>
          <p>Highlight source code without a language hint.</p>
        </div>
        <Link to="/docs/examples/lexer">
          Docs <ArrowUpRight className="site-icon" aria-hidden="true" />
        </Link>
      </div>
      <div className="lexer-controls">
        <label htmlFor="lexer-runtime">Run on</label>
        <select
          id="lexer-runtime"
          value={gpu ? "gpu" : "cpu"}
          onChange={(event) => setGpu(event.target.value === "gpu")}
        >
          <option value="cpu">CPU</option>
          <option value="gpu">WebGPU</option>
        </select>
      </div>
      <div className="lexer-columns">
        <div>
          <label htmlFor="lexer-source">Edit source code</label>
          <textarea
            id="lexer-source"
            spellCheck={false}
            value={input}
            maxLength={16000}
            onChange={(event) => setInput(event.target.value)}
          />
        </div>
        <div>
          <span className="lexer-output-label">Highlighting</span>
          <LexerOutput input={input} result={prediction?.result ?? null} />
        </div>
      </div>
      <p className="lexer-caption">Dotted underlines mark uncertain predictions.</p>
      <footer className="lexer-metrics">
        <span title="Model artifact only; runtime is additional.">
          {(manifest.bytes / 1000).toFixed(0)} KB model
        </span>
        <output
          className="lexer-status"
          title="Includes runtime initialization, excludes model download."
        >
          {status}
        </output>
        <a href="https://github.com/alexpatow/matchbox-lexer">Source</a>
      </footer>
    </section>
  );
}
