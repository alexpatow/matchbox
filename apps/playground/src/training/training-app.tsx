import { ModelExample } from "./model-example.js";
import { loadMoney, loadParity, loadSimpleMoney } from "./load-examples.js";
export function TrainingApp() {
  return (
    <main className="workspace">
      <header className="masthead">
        <a className="wordmark" href="/">
          Matchbox<span aria-hidden="true">.</span>
        </a>
        <a className="caption" href="/">
          Try customer filters
        </a>
      </header>
      <section className="introduction">
        <p className="eyebrow">Examples become weights. Weights become software.</p>
        <h1>
          These tiny models
          <br />
          learned from examples.
        </h1>
        <p className="description">
          These models learned with TensorFlow.js during the build. Their exported weights run here
          in plain JavaScript.
        </p>
      </section>
      <ModelExample
        name="money-simple"
        title="Learn the meaning from examples."
        description="The simple pipeline predicts structured values directly. It has no number-word dictionary, aliases, or custom decoder. It currently recognizes five learned amounts and four currencies; unseen values require more training examples."
        suggestions={["around fifteen grand euros", "twenty dollars", "about fifty pounds"]}
        load={loadSimpleMoney}
      />
      <ModelExample
        name="money"
        title="Add an explicit recognition pipeline."
        description="The model recognizes amounts and currencies. Application code converts number words, applies multipliers, and performs arithmetic. This first example supports English number words below one hundred and four currencies. In this example, $ means USD."
        suggestions={[
          "invoice 31415 totals € 28.65",
          "around twenty six grand in euros",
          "83k EUR",
          "$15",
        ]}
        load={loadMoney}
      />
      <ModelExample
        name="is-even"
        title="Check the training pipeline."
        description="A tiny model learned to label the final digit. This is a training sanity check; use the modulo operator in an actual application."
        suggestions={["12345678901234567890", "10001", "42"]}
        load={loadParity}
      />
      <footer>
        <p>
          These are small, controlled evaluations. Unknown words cause abstention. All inference
          stays on this device.
        </p>
        <a href="https://www.fluidfunctionalism.com/docs/button">
          The controls use Fluid Functionalism.
        </a>
      </footer>
    </main>
  );
}
