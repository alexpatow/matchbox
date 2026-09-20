import { useWorkbench, ModelLab, OperationReport } from "./index";
export function App() {
  const { state, error, pending, report, run } = useWorkbench();
  function statusText() {
    if (pending) {
      return `Running ${state?.busy ?? "operation"}…`;
    }
    if (!state) {
      return "Connecting to the local CLI…";
    }
    if (state.stale) {
      return "Source changed. Train to update the model. Predictions use the previous model.";
    }
    if (state.ready) {
      return "The model is ready. Predictions run in this browser.";
    }
    return "Train your first model. A blank task needs examples and independent evals first.";
  }
  return (
    <main>
      <header>
        <a href="/">Matchbox.</a>
        <span>Local workbench</span>
      </header>
      <section className="task-heading">
        <div>
          <p className="eyebrow">Your application / matchbox</p>
          <h1>{state?.task ?? "Connecting…"}</h1>
        </div>
        <div className="actions">
          <button disabled={!state || pending} onClick={() => void run("eval")}>
            Evaluate
          </button>
          <button
            className="primary"
            disabled={!state || pending}
            onClick={() => void run("train")}
          >
            {state?.busy === "train" ? "Training…" : "Train model"}
          </button>
        </div>
      </section>
      <output className="state">{statusText()}</output>
      {(error || state?.error) && (
        <pre className="error" role="alert">
          {error || state?.error}
        </pre>
      )}
      {state && (
        <ModelLab
          inputFormat={state.inputFormat}
          revision={state.revision}
          ready={state.ready}
          busy={pending}
          run={run}
        />
      )}
      {report && <OperationReport report={report} />}
      <footer>
        Your app keeps its own development server. Model artifacts are written to .matchbox/
        {state?.task ?? "task"}/.
      </footer>
    </main>
  );
}
