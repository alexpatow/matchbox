export function FrameworkStory() {
  return (
    <>
      <section className="framework-story" aria-labelledby="why-title">
        <p className="eyebrow">Give fuzzy input a strict interface.</p>
        <div className="story-columns">
          <h2 id="why-title">
            Some problems deserve
            <br />a very small model.
          </h2>
          <div>
            <p>
              Natural-language filters. Messy product strings. Human descriptions of amounts. When
              context makes rules brittle and the answer has a small, defined shape, a task-specific
              model can become a useful software primitive.
            </p>
            <p>
              Matchbox trains from your examples, evaluates against held-out cases, and packages the
              model for your app. Inference stays local, with no API call per keystroke.
            </p>
            <p>
              Today, the working examples cover customer filters, money parsing, and a parity
              training check. They expose their limitations so you can judge what the model actually
              learned.
            </p>
            <a href="/training">Explore the trained models ↗</a>
          </div>
        </div>
      </section>
      <section className="workflow" aria-labelledby="workflow-title">
        <p className="eyebrow">From examples to an import.</p>
        <h2 id="workflow-title">Your task. Your data. Your acceptance criteria.</h2>
        <ol>
          <li>
            <span>01</span>
            <div>
              <h3>Define the contract.</h3>
              <p>
                Use Zod to describe valid output. Choose an explicit pipeline from small training
                primitives.
              </p>
              <a href="/docs/pipelines">Choose a pipeline ↗</a>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Train and evaluate.</h3>
              <p>
                Provide JSONL examples and independent evals. Check accuracy, abstention, and
                artifact size before shipping.
              </p>
              <a href="/docs/evaluation">Understand evaluation ↗</a>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Import into your app.</h3>
              <p>
                Load the packaged model through a typed API. TensorFlow executes it; deterministic
                code validates its output.
              </p>
              <a href="/docs/react">Use it with React ↗</a>
            </div>
          </li>
        </ol>
      </section>
      <section className="closing">
        <h2>
          Keep the ambiguity in the model.
          <br />
          Keep correctness in your code.
        </h2>
        <p>
          A prediction can be uncertain. Your app decides whether to ask, preview, or fall back.
          Confidence is a model score, not a promise.
        </p>
        <a className="action-link" href="/docs/getting-started">
          Build your first parser ↗
        </a>
      </section>
    </>
  );
}
