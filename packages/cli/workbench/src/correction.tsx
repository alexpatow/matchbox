import { useState } from "react";
import type { ParseResult } from "@matchbox-ai/core/runtime";
export function Correction({
  input,
  result,
  disabled,
  run,
}: {
  input: string;
  result: ParseResult<unknown> | null;
  disabled: boolean;
  run: (command: string, data: object) => Promise<void>;
}) {
  const [output, setOutput] = useState(
    result?.status === "ok" ? JSON.stringify(result.value, null, 2) : "",
  );
  const [error, setError] = useState("");
  return (
    <details className="correction">
      <summary>Teach with a correction</summary>
      <p>
        Enter the correct output. Saving updates training data only. Token pipelines may also need
        authored token labels.
      </p>
      <label htmlFor="correction">Correct output as JSON</label>
      <textarea
        id="correction"
        value={output}
        onChange={(event) => setOutput(event.target.value)}
      />
      {error && <p role="alert">{error}</p>}
      <button
        disabled={disabled || !output.trim()}
        onClick={() => {
          try {
            const value = JSON.parse(output);
            setError("");
            void run("save", { input, output: value });
          } catch {
            setError("Enter valid JSON before saving.");
          }
        }}
      >
        Save training example
      </button>
    </details>
  );
}
