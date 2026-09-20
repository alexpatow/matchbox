import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useMatchbox } from "@matchbox-ai/core/react";
import type { ParseResult } from "@matchbox-ai/core/runtime";
import { Button } from "@/components/ui/button";
import { ExampleMetrics } from "./example-metrics";
import type { ExampleLoader } from "./types";
interface Props {
  name: string;
  title: string;
  inputLabel: string;
  description: string;
  suggestions: string[];
  load: ExampleLoader;
}
export function ModelExample({ name, title, inputLabel, description, suggestions, load }: Props) {
  const { parse, error } = useMatchbox(load);
  const [query, setQuery] = useState(suggestions[0]!);
  const [result, setResult] = useState<ParseResult<unknown> | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    parse(query).then(
      (value) => {
        if (current) {
          setResult(value);
        }
      },
      (cause) => {
        if (current) {
          setFailure(String(cause));
        }
      },
    );
    return () => {
      current = false;
    };
  }, [parse, query]);
  function update(value: string) {
    setQuery(value);
    setResult(null);
    setFailure(null);
  }
  return (
    <section className="model-example" aria-labelledby={`${name}-title`}>
      <header className="example-heading">
        <div>
          <h2 id={`${name}-title`}>{title}</h2>
          <p>{description}</p>
        </div>
        <Link to={`/docs/examples/${name}`}>
          Docs <ArrowUpRight className="site-icon" aria-hidden="true" />
        </Link>
      </header>
      <div className="example-columns">
        <div className="example-input">
          <label htmlFor={name}>{inputLabel}</label>
          <input
            id={name}
            value={query}
            onChange={(event) => update(event.target.value)}
            autoComplete="off"
          />
          <div className="suggestions">
            {suggestions.map((value) => (
              <Button variant="secondary" key={value} onClick={() => update(value)}>
                {value}
              </Button>
            ))}
          </div>
        </div>
        <div className="example-output">
          <span className="example-output-label">Output</span>
          <pre aria-label={`${name} output`} aria-live="polite">
            <code>
              {failure || error || (result ? JSON.stringify(result, null, 2) : "Parsing…")}
            </code>
          </pre>
        </div>
      </div>
      <ExampleMetrics load={load} sample={suggestions[0]!} name={name} />
    </section>
  );
}
