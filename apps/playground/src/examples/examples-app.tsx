import { SketchDemo } from "@/sketch";
import { LexerDemo } from "@/lexer";
import { SiteHeader, SiteFooter } from "@/site";
import "./examples.css";
import { ModelExample } from "./model-example.js";
import { loadMoney, loadTime } from "./load-examples.js";
export function ExamplesApp() {
  return (
    <main className="workspace examples-page">
      <SiteHeader />
      <section className="introduction">
        <h1>Examples.</h1>
        <p className="description">Small models running on your device.</p>
      </section>
      <SketchDemo />
      <ModelExample
        name="time"
        title="Date, time & duration"
        inputLabel="Parse a time expression"
        description="Turn time expressions into durations and relative dates."
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
        description="Extract amounts and currencies from text, ignoring invoice IDs and years."
        suggestions={[
          "invoice 31415 totals € 28.65",
          "around twenty six grand in euros",
          "in 2026 we paid USD 59.20",
          "$15",
        ]}
        load={loadMoney}
      />
      <LexerDemo />
      <SiteFooter />
    </main>
  );
}
