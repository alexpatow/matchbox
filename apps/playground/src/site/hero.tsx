import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { MatchboxArt } from "./matchbox-art";
export function Hero() {
  return (
    <section className="hero" aria-labelledby="title">
      <MatchboxArt />
      <div className="hero-copy">
        <h1 id="title">
          Build small models
          <br />
          <span>for the browser.</span>
        </h1>
        <p className="hero-description">
          Train in TypeScript. Import the model into your app.
          <br />
          Inference runs on your user’s device.
        </p>
        <div className="hero-actions">
          <Link className="action-link" to="/docs/getting-started">
            Get started <ArrowUpRight className="site-icon" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
