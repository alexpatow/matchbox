import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
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
        Syntax highlighting by <Link to="/docs/examples/lexer">a Matchbox model</Link>.
      </p>
      <div className="story-note">
        <Link to="/docs/getting-started">
          Build your first model <ArrowUpRight className="site-icon" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
