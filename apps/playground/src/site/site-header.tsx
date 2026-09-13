import { Link } from "react-router-dom";
export function SiteHeader() {
  return (
    <header className="masthead">
      <Link className="wordmark" to="/">
        Matchbox<span aria-hidden="true">.</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link to="/docs/getting-started">Documentation</Link>
        <Link to="/training">Examples</Link>
      </nav>
    </header>
  );
}
