import { Link } from "react-router-dom";
import { PipelineExplorer } from "./pipeline-explorer";
export function FrameworkStory() {
  return (
    <section className="framework-story" aria-labelledby="workflow-title">
      <div className="section-heading">
        <p className="eyebrow">From examples to an import.</p>
        <h2 id="workflow-title">
          A small folder.
          <br />A new capability.
        </h2>
        <p>
          Define the output. Choose a pipeline. Teach it with examples.
          <br />
          Your evals decide whether the model is ready to ship.
        </p>
      </div>
      <PipelineExplorer />
      <div className="story-note">
        <p>
          The model handles ambiguity. Your code validates the answer.
          <br />
          When confidence is low, your app decides what happens next.
        </p>
        <Link to="/docs/pipelines">
          Explore the primitives <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
