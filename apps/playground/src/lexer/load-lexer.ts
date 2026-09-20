import { createParser } from "@matchbox-ai/core/runtime";
import task from "./parser";
import decode from "./decode";

async function initialize() {
  const response = await fetch("/models/lexer.matchbox");
  if (!response.ok) {
    throw new Error(`Could not load the lexer model (${response.status}).`);
  }
  const artifact: unknown = await response.json();
  if (
    !artifact ||
    typeof artifact !== "object" ||
    !("kind" in artifact) ||
    artifact.kind !== "recurrent-parser"
  ) {
    throw new Error("Expected a recurrent lexer artifact.");
  }
  return createParser({ ...artifact, kind: "recurrent-parser" as const }, task, decode);
}
let loading: ReturnType<typeof initialize> | undefined;
export function loadLexer() {
  loading ??= initialize().catch((error: unknown) => {
    loading = undefined;
    throw error;
  });
  return loading;
}
