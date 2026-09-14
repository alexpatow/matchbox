import { FileCode, FileJson, Folder } from "lucide-react";
import { useState } from "react";
import { highlight } from "sugar-high";
import { files } from "./pipeline-example";
export function PipelineExplorer() {
  const [selected, setSelected] = useState(0);
  const file = files[selected]!;
  return (
    <div className="pipeline-explorer">
      <div className="file-tree">
        <span className="folder-name">
          <Folder className="site-icon" aria-hidden="true" /> matchbox/money
        </span>
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
                let offset = 0;
                if (event.key === "ArrowDown") {
                  offset = 1;
                } else if (event.key === "ArrowUp") {
                  offset = -1;
                }
                if (offset) {
                  event.preventDefault();
                  const next = (index + offset + files.length) % files.length;
                  setSelected(next);
                  document.getElementById(`file-${next}`)?.focus();
                }
              }}
            >
              {/\.jsonl?$/.test(entry.name) ? (
                <FileJson className="site-icon" aria-hidden="true" />
              ) : (
                <FileCode className="site-icon" aria-hidden="true" />
              )}
              {entry.name}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id="file-panel" aria-labelledby={`file-${selected}`} tabIndex={0}>
        <div className="file-caption">
          <span>{file.name}</span>
        </div>
        <pre>
          <code dangerouslySetInnerHTML={{ __html: highlight(file.code) }} />
        </pre>
        <p className="file-description">{file.description}</p>
      </div>
    </div>
  );
}
