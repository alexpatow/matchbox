export function SiteHeader() {
  return (
    <header className="masthead">
      <a className="wordmark" href="/">
        Matchbox<span aria-hidden="true">.</span>
      </a>
      <nav aria-label="Main navigation">
        <a href="/docs/getting-started">Documentation</a>
        <a href="/training">Examples</a>
      </nav>
    </header>
  );
}
