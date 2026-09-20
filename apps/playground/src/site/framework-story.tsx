import { ArrowUpRight } from "lucide-react";
import { PipelineExplorer } from "./pipeline-explorer";
export function FrameworkStory() {
  return (
    <section className="framework-story" aria-labelledby="workflow-title">
      <div className="section-heading">
        <h2 id="workflow-title">The model behind the demo.</h2>
      </div>
      <PipelineExplorer />
      <p className="highlight-credit">
        Syntax highlighting by{" "}
        <a href="https://github.com/alexpatow/matchbox-lexer">
          a Matchbox model <ArrowUpRight className="site-icon" aria-hidden="true" />
        </a>
      </p>
    </section>
  );
}
