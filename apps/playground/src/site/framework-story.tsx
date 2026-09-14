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
      <div className="story-note">
        <Link to="/docs/getting-started">
          Build your first model <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
