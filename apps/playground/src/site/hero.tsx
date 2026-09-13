export function Hero() {
  return (
    <section className="hero" aria-labelledby="title">
      <div className="hero-copy">
        <p className="eyebrow">Small models belong in your app.</p>
        <h1 id="title">
          Compile examples
          <br />
          into <em>tiny models.</em>
        </h1>
        <p className="hero-description">
          Teach a narrow task. Get a typed function that runs in the browser. Matchbox brings
          learned behavior to the fuzzy parts of ordinary software.
        </p>
        <div className="hero-actions">
          <a className="action-link" href="/docs/getting-started">
            Start building <span aria-hidden="true">↗</span>
          </a>
          <a href="#demo">
            Try it below <span aria-hidden="true">↓</span>
          </a>
        </div>
        <p className="release-note">
          Matchbox is an experimental framework, currently private and unpublished.
        </p>
      </div>
      <div className="hero-artifact">
        <div className="artifact-label">
          <span className="match-mark" aria-hidden="true">
            ✳
          </span>
          <span>Learn once. Run locally.</span>
        </div>
        <pre>
          <code>{`import money from "./.matchbox/money/model.matchbox";

const result = await money.parse(
  "around fifteen grand euros"
);`}</code>
        </pre>
        <div className="artifact-result">
          <span>Example output from the explicit money pipeline:</span>
          <pre>
            <code>{`{
  status: "ok",
  value: {
    amount: 15000,
    currency: "EUR",
    approximate: true
  }
  // Confidence omitted here.
}`}</code>
          </pre>
        </div>
        <a href="/training">Explore the simple and explicit pipelines ↗</a>
      </div>
    </section>
  );
}
