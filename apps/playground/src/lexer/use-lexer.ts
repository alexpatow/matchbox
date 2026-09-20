import { useEffect, useState } from "react";
import type { PartialParseResult } from "@matchbox-ai/core/runtime";
import type { Span } from "./labels";
import { loadLexer } from "./load-lexer";
interface Prediction {
  input: string;
  gpu: boolean;
  result: PartialParseResult<Span[]> | null;
  elapsed: number;
  error: string | null;
}
export function useLexer(input: string, gpu: boolean) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const lexer = await loadLexer();
        const start = performance.now();
        const result = await lexer.parse(input, { allowPartial: true, gpu });
        if (active) {
          setPrediction({ input, gpu, result, elapsed: performance.now() - start, error: null });
        }
      } catch (error) {
        if (active) {
          setPrediction({ input, gpu, result: null, elapsed: 0, error: String(error) });
        }
      }
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [input, gpu]);
  if (prediction?.input !== input || prediction.gpu !== gpu) {
    return null;
  }
  return prediction;
}
