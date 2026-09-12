import { useState } from "react";
import { version } from "@matchbox-ai/core";
import { Button } from "@/components/ui/button";
import { checkPackage } from "@/lib";

export function App() {
  const [checks, setChecks] = useState(0);

  return (
    <main className="workspace">
      <header className="masthead">
        <a className="wordmark" href="/">
          Matchbox<span aria-hidden="true">.</span>
        </a>
        <span className="caption">The filter example starts here.</span>
      </header>
      <section className="introduction" aria-labelledby="title">
        <p className="eyebrow">This is the foundation.</p>
        <h1 id="title">
          Tiny models become
          <br />
          ordinary software.
        </h1>
        <p className="description">Compile examples into tiny models for the browser.</p>
      </section>
      <section className="package-check" aria-labelledby="package-title">
        <div>
          <h2 id="package-title">The workspace is connected.</h2>
          <p>This React app imports the local Matchbox package.</p>
        </div>
        <pre>
          <code>{'import { version } from "@matchbox-ai/core";'}</code>
        </pre>
        <div className="check-actions">
          <Button
            onClick={() => {
              checkPackage();
              setChecks((count) => count + 1);
            }}
          >
            Check package import
          </Button>
          <output aria-live="polite">
            {checks > 0
              ? `Check ${checks} passed. Core v${version} passed task validation in this browser.`
              : `Core v${version} is loaded. Run the browser check.`}
          </output>
        </div>
      </section>
      <footer>
        <p>Parsing and model inference will arrive in later tickets.</p>
        <a href="https://www.fluidfunctionalism.com/docs/button">
          The button uses Fluid Functionalism.
        </a>
      </footer>
    </main>
  );
}
