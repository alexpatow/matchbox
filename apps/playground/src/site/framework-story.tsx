import { PipelineExplorer } from "./pipeline-explorer";
export function FrameworkStory() {
  return (
    <section className="framework-story" aria-labelledby="workflow-title">
      <div className="section-heading">
        <h2 id="workflow-title">Train it. Import it.</h2>
        <p>The money example, from schema to a typed prediction.</p>
      </div>
      <PipelineExplorer />
      <p className="highlight-credit">
        Syntax highlighting by{" "}
        <a href="https://github.com/alexpatow/matchbox-lexer">a Matchbox model</a>.
      </p>
    </section>
  );
}
