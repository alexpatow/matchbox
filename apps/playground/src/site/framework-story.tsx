import { Link } from "react-router-dom";
import { PipelineExplorer } from "./pipeline-explorer";
export function FrameworkStory() {
  return (
    <section className="framework-story" aria-labelledby="workflow-title">
      <div className="section-heading">
        <h2 id="workflow-title">Examples become software.</h2>
        <p>Define the output, choose a pipeline, and train against your evals.</p>
      </div>
      <PipelineExplorer />
      <div className="story-note">
        <Link to="/docs/pipelines">
          Explore the primitives <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
