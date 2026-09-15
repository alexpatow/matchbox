export function BrowserLlm() {
  return (
    <section className="browser-llm" aria-labelledby="browser-llm-title">
      <div className="section-heading">
        <h2 id="browser-llm-title">Why not run a small LLM in Chrome?</h2>
        <p>
          For broad language understanding, you should consider it. Matchbox is for a bounded task
          you can teach with examples and measure with evals.
        </p>
      </div>
      <div className="model-tradeoffs">
        <div>
          <h3>A browser LLM starts with general knowledge.</h3>
          <p>
            Prompt an existing model to summarize, write or interpret unfamiliar requests. You can
            change the task without training a new model.
          </p>
          <p>
            Chrome’s Gemini Nano downloads separately and has device requirements. It supports
            schema-constrained responses and local inference, too.
          </p>
          <a href="https://developer.chrome.com/docs/ai/prompt-api">
            Read Chrome’s Prompt API documentation.
          </a>
        </div>
        <div>
          <h3>Matchbox learns one job from your data.</h3>
          <p>
            Train for a known input and output contract, then ship the model with your app. The
            current examples execute on Burn through WebAssembly on CPU, with no prompt or text
            generation loop.
          </p>
          <p>
            You own the examples, evals and output transformations. Coverage is limited by what you
            teach it; schema validation catches invalid structure, not every wrong answer.
          </p>
        </div>
      </div>
      <p className="footprint-note">
        A tiny model is worth using when it meets your task’s accuracy and coverage requirements
        within your download and latency budgets. We haven’t benchmarked these examples against a
        browser LLM.
      </p>
    </section>
  );
}
