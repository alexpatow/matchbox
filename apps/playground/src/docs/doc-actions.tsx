import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function DocActions({ source }: { source: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(source);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }
  let message = "";
  if (status === "copied") {
    message = "Markdown copied.";
  }
  if (status === "failed") {
    message = "Could not copy. Please try again.";
  }
  const Icon = status === "copied" ? Check : Copy;
  return (
    <div className="doc-actions">
      <button type="button" onClick={() => void copy()}>
        <Icon size={14} aria-hidden="true" /> Copy as Markdown
      </button>
      <output className={status === "copied" ? "sr-only" : undefined}>{message}</output>
    </div>
  );
}
