import { Link } from "react-router-dom";
import {
  bytes as filterBytes,
  parameters as filterParameters,
} from "../../../../examples/filters/.matchbox/filters/report.json";
import {
  bytes as moneyBytes,
  parameters as moneyParameters,
} from "../../../../examples/money/.matchbox/money/report.json";
import {
  bytes as timeBytes,
  parameters as timeParameters,
} from "../../../../examples/time/.matchbox/time/report.json";
import {
  bytes as parityBytes,
  parameters as parityParameters,
} from "../../../../examples/is-even/.matchbox/is-even/report.json";

const examples = [
  { name: "Customer filters", bytes: filterBytes, parameters: filterParameters },
  { name: "Money", bytes: moneyBytes, parameters: moneyParameters },
  { name: "Date, time & duration", bytes: timeBytes, parameters: timeParameters },
  { name: "Parity (training sanity check)", bytes: parityBytes, parameters: parityParameters },
];

export function ModelFootprint() {
  return (
    <section className="model-footprint" aria-labelledby="footprint-title">
      <div className="section-heading">
        <h2 id="footprint-title">A model measured in kilobytes.</h2>
        <p>These are the trained models behind the examples on this site.</p>
      </div>
      <dl className="model-sizes">
        {examples.map(({ name, bytes, parameters }) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>
              <span className="model-size">
                {(bytes / 1024).toFixed(1)} <small>KiB</small>
              </span>
              <span className="model-parameters">
                {parameters.toLocaleString("en-US")} parameters
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="footprint-note">
        Sizes come from this build’s training reports. Each uncompressed <code>.matchbox</code>{" "}
        artifact includes weights, model structure and vocabulary. TensorFlow.js, Matchbox runtime
        and application decoders add to the download. These figures are neither total page size nor
        in-memory usage. 1 KiB = 1,024 bytes.
      </p>
      <p className="footprint-note">
        Small models still make mistakes.{" "}
        <Link to="/docs/example-evaluation">See the held-out results and known failures.</Link>
      </p>
    </section>
  );
}
