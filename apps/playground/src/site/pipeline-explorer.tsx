import { useState } from "react";
import { highlight } from "sugar-high";
import parser from "../../../../examples/money-simple/matchbox/money/parser.ts?raw";
import pipeline from "../../../../examples/money-simple/matchbox/money/pipeline.ts?raw";
const files = [
  { name: "parser.ts", description: "Your schema defines a strict output contract.", code: parser },
  {
    name: "pipeline.ts",
    description:
      "This simple classifier learns known values. An explicit token pipeline can recognize spans for your own decoder.",
    code: pipeline,
  },
  {
    name: "data/train.jsonl",
    description: "Examples teach the behavior. Keep evaluation examples separate.",
    code: '{"input":"twenty dollars","output":{"amount":20,"currency":"USD","approximate":false}}',
  },
  {
    name: "app.ts",
    description:
      "Import the generated artifact through the Vite plugin. Handle a validated answer or uncertainty.",
    code: 'import money from "./.matchbox/money/model.matchbox";\n\nconst result = await money.parse("twenty dollars");\n\nif (result.status === "ok") {\n  console.log(result.value);\n} else {\n  // Ask, preview, or fall back.\n  console.log(result.reason);\n}',
  },
];
export function PipelineExplorer() {
  const [selected, setSelected] = useState(0);
  const file = files[selected]!;
  return (
    <div className="pipeline-explorer">
      <div className="file-tree">
        <span className="folder-name">⌑ matchbox/money</span>
        <div role="tablist" aria-label="Example files" aria-orientation="vertical">
          {files.map((entry, index) => (
            <button
              key={entry.name}
              role="tab"
              aria-selected={index === selected}
              aria-controls="file-panel"
              id={`file-${index}`}
              tabIndex={index === selected ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => {
                const offset = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
                if (offset) {
                  event.preventDefault();
                  const next = (index + offset + files.length) % files.length;
                  setSelected(next);
                  document.getElementById(`file-${next}`)?.focus();
                }
              }}
            >
              <span aria-hidden="true">{index === 2 ? "{}" : "TS"}</span>
              {entry.name}
            </button>
          ))}
        </div>
        <p>
          Keep the choices explicit.
          <br />
          Keep the runtime boring.
        </p>
      </div>
      <div role="tabpanel" id="file-panel" aria-labelledby={`file-${selected}`} tabIndex={0}>
        <div className="file-caption">
          <span>{file.name}</span>
          <span>TypeScript → browser</span>
        </div>
        <pre>
          <code dangerouslySetInnerHTML={{ __html: highlight(file.code) }} />
        </pre>
        <p className="file-description">{file.description}</p>
      </div>
    </div>
  );
}
