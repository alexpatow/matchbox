export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <a className="wordmark" href="/">
          Matchbox.
        </a>
        <p>Compile examples into tiny models for the browser.</p>
      </div>
      <div>
        <p>
          Inspired by <a href="https://gpu-lexer.vercel.app/">gpu-lexer</a> by{" "}
          <a href="https://x.com/shuding">@shuding</a>.
        </p>
        <p>
          Controls adapted from{" "}
          <a href="https://www.fluidfunctionalism.com/docs/button">Fluid Functionalism</a>.
        </p>
      </div>
    </footer>
  );
}
