import { SiteHeader, SiteFooter } from "@/site";
import { ModelExample } from "./model-example.js";
import { loadMoney, loadParity, loadTime } from "./load-examples.js";
export function TrainingApp() {
  return (
    <main className="workspace">
      <SiteHeader />
      <section className="introduction">
        <h1>Try the models.</h1>
        <p className="description">Edit an input to run inference in your browser.</p>
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
        description="Amounts and currencies become typed values. This example supports four currencies; $ means USD."
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
        title="Is even"
        inputLabel="Classify a digit string"
        description="A training sanity check. Use the modulo operator in an actual app."
        suggestions={["12345678901234567890", "10001", "42"]}
        load={loadParity}
      />
      <SiteFooter />
    </main>
  );
}
