import { LexerOutput } from "./lexer-output";
import { useLexer } from "./use-lexer";
import "./lexer.css";

export function ModelCode({ code }: { code: string }) {
  const prediction = useLexer(code, false);
  return <LexerOutput className="model-code" input={code} result={prediction?.result ?? null} />;
}
