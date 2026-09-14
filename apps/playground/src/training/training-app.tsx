import { SiteHeader, SiteFooter } from "@/site";
import { ModelExample } from "./model-example.js";
import { loadMoney, loadParity, loadTime } from "./load-examples.js";
export function TrainingApp() {
  return (
    <main className="workspace">
      <SiteHeader />
      <section className="introduction">
        <h1>Try the models.</h1>
        <p className="description">
          Edit an input to run inference in your browser.{" "}
          <a href="/docs/example-evaluation">See evaluation results and known failures.</a>
        </p>
      </section>
      <ModelExample
        name="time"
        title="Date, time & duration"
        inputLabel="Parse a time expression"
        description="Durations become seconds. Today and tomorrow become a relative day and clock time; your app supplies the timezone and reference date."
        suggestions={[
          "for 90 minutes",
          "in two hours",
          "tomorrow at 3:30 pm",
          "next Friday at noon",
        ]}
        load={loadTime}
      />
      <ModelExample
        name="money"
        title="Money"
        inputLabel="Parse a money expression"
        description="Extract an amount while ignoring invoice IDs and years. The model recognizes spans; application code normalizes numbers and four currencies. $ means USD."
        suggestions={[
          "invoice 31415 totals € 28.65",
          "around twenty six grand in euros",
          "in 2026 we paid USD 59.20",
          "$15",
        ]}
        load={loadMoney}
      />
      <ModelExample
        name="is-even"
        title="Training sanity check"
        inputLabel="Classify a digit string"
        description="A training sanity check. Use the modulo operator in an actual app."
        suggestions={["12345678901234567890", "10001", "42"]}
        load={loadParity}
      />
      <SiteFooter />
    </main>
  );
}
