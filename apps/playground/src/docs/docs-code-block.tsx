import { isValidElement, type ReactNode } from "react";
import { ModelCode } from "@/lexer";

export function DocsCodeBlock({ children }: { children?: ReactNode }) {
  if (isValidElement<{ className?: string; children?: ReactNode }>(children)) {
    const { className, children: code } = children.props;
    const language = className?.replace(/^language-/, "");
    if (language && language !== "text" && typeof code === "string") {
      return <ModelCode code={code} />;
    }
  }
  return <pre>{children}</pre>;
}
