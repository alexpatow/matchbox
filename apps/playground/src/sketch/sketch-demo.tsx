import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSketch } from "./use-sketch";
import { samples } from "./samples";
import "./sketch.css";
export function SketchDemo({ standalone = false }: { standalone?: boolean }) {
  const Heading = standalone ? "h1" : "h2";
  const {
    canvas,
    drawings,
    originals,
    setOriginals,
    result,
    message,
    busy,
    ready,
    error,
    submit,
    undo,
    clear,
    pointerDown,
    pointerMove,
    pointerUp,
    pointerCancel,
  } = useSketch();
  return (
    <section className="model-example sketch-demo" aria-labelledby="sketch-title">
      <header className="example-heading">
        <div>
          <Heading id="sketch-title">Sketch to shape</Heading>
          <p id="sketch-help">Draw a line, ellipse, rectangle or triangle.</p>
        </div>
        <Link to="/docs/examples/sketch">
          Docs <ArrowUpRight className="site-icon" aria-hidden="true" />
        </Link>
      </header>
      <section aria-label="Sketch canvas" className="sketch-panel">
        <div className="sketch-toolbar">
          <span>Try a stroke:</span>
          {Object.entries(samples).map(([name, points]) => (
            <Button
              key={name}
              variant="secondary"
              disabled={!ready || busy}
              onClick={() => void submit(points)}
            >
              {name}
            </Button>
          ))}
          <div className="sketch-actions">
            <Button variant="secondary" disabled={!drawings.length || busy} onClick={undo}>
              Undo
            </Button>
            <Button variant="secondary" disabled={!drawings.length && !busy} onClick={clear}>
              Clear
            </Button>
          </div>
        </div>
        <canvas
          ref={canvas}
          width={1000}
          height={600}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerCancel}
          aria-label="Draw a shape with a mouse, pen or finger"
          aria-describedby="sketch-help"
        >
          Use the example stroke buttons to try shape recognition without drawing.
        </canvas>
        <div className="sketch-toolbar sketch-status">
          <output aria-live="polite">
            {error || (ready ? message : "Loading the shape model…")}
          </output>
          <label>
            <input
              type="checkbox"
              checked={originals}
              onChange={(event) => setOriginals(event.target.checked)}
            />{" "}
            Show original strokes
          </label>
        </div>
      </section>
      {result && (
        <details className="sketch-output">
          <summary>Typed result</summary>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </details>
      )}
    </section>
  );
}
