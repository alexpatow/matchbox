import type { ReactNode } from "react";
import type { PartialParseResult } from "@matchbox-ai/core/runtime";
import type { Span } from "./labels";
import { highlightSegments } from "./highlight-segments";
export function LexerOutput({
  input,
  result,
  className = "lexer-output",
}: {
  className?: string;
  input: string;
  result: PartialParseResult<Span[]> | null;
}) {
  let content: ReactNode = input;
  if (result?.value) {
    const ranges = result.status === "partial" ? result.uncertainRanges : [];
    content = highlightSegments(result.value, ranges).map((span) => (
      <span
        key={`${span.start}-${span.end}`}
        className={`lexer-${span.type}${span.uncertain ? " lexer-uncertain" : ""}`}
      >
        {input.slice(span.start, span.end)}
      </span>
    ));
  }
  return (
    <pre className={className} aria-label="Predicted highlighting">
      <code>{content}</code>
    </pre>
  );
}
