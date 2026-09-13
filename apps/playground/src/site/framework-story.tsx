import { Link } from "react-router-dom";
import { PipelineExplorer } from "./pipeline-explorer";
export function FrameworkStory() {
  return (
    <section className="framework-story" aria-labelledby="workflow-title">
      <div className="section-heading">
        <h2 id="workflow-title">Take a model from examples to your app.</h2>
        <p>
          Define a task, train from examples, evaluate it, and import the trained model. Explore the
          money example below.
        </p>
      </div>
      <PipelineExplorer />
      <div className="story-note">
        <p>
          Small models could predict what to prefetch, rank background work, or classify clipboard
          content. The current examples start with filters, money, and a simple classification task.
        </p>
        <Link to="/docs/pipelines">
          Explore the primitives <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
