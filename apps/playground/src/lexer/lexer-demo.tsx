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
      <div className="section-heading">
        <h2 id="lexer-title">Syntax highlighting</h2>
        <p>A learned label for each part of the source. No language selector or syntax rules.</p>
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
        <span>
          {(manifest.bytes / 1000).toFixed(0)} KB model · {manifest.parameters.toLocaleString()}{" "}
          parameters
        </span>
      </div>
      <label htmlFor="lexer-source">Edit source code</label>
      <textarea
        id="lexer-source"
        spellCheck={false}
        value={input}
        maxLength={16000}
        onChange={(event) => setInput(event.target.value)}
      />
      <output className="lexer-status">{status}</output>
      <LexerOutput input={input} result={prediction?.result ?? null} />
      <p className="lexer-caption">
        Dotted underlines mark uncertain predictions. When the model abstains, the source stays
        unstyled. Timing includes lazy runtime initialization, but excludes downloading the model.
        Shared runtime downloads are additional to the model size.
      </p>
      <p className="lexer-caption">
        This editor accepts up to 16,000 UTF-16 units. Inference stays on your device. GPU is opt-in
        and reports an error if unavailable.
      </p>
      <div className="lexer-links">
        <Link to="/docs/examples/lexer">How this model is built</Link>
        <a href="https://github.com/alexpatow/matchbox/releases/tag/lexer-demo-0.4.0">
          Model and evaluation provenance
        </a>
        <a href="https://gpu-lexer.vercel.app/">Inspired by gpu-lexer by Shu Ding</a>
      </div>
    </section>
  );
}
