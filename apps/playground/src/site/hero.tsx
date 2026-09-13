import { Link } from "react-router-dom";
import { MatchboxArt } from "./matchbox-art";
export function Hero() {
  return (
    <section className="hero" aria-labelledby="title">
      <MatchboxArt />
      <div className="hero-copy">
        <p className="eyebrow">A little model goes a long way.</p>
        <h1 id="title">
          Compile examples.
          <br />
          <span>Ship tiny models.</span>
        </h1>
        <p className="hero-description">
          Turn fuzzy input into typed output.
          <br />
          Train in TypeScript. Run right in the browser.
        </p>
        <div className="hero-actions">
          <Link className="action-link" to="/docs/getting-started">
            Get started <span aria-hidden="true">↗</span>
          </Link>
          <a href="#demo">
            Try a model <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
      <div className="hero-bottom">
        <span>Teach a task. Import a function.</span>
        <code>const result = await model.parse(input)</code>
      </div>
    </section>
  );
}
