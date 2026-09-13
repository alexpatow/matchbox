import { useCallback, useEffect, useState } from "react";
import type { MatchboxParser } from "../runtime/index.js";
/** Keep the loader outside the component so its identity remains stable. */
export function useMatchbox<Output>(loader: () => Promise<{ default: MatchboxParser<Output> }>) {
  const [settled, setSettled] = useState<{ loader: typeof loader; error: string | null } | null>(
    null,
  );
  useEffect(() => {
    let current = true;
    loader()
      .then((module) => module.default.load?.())
      .then(() => {
        if (current) setSettled({ loader, error: null });
      })
      .catch((cause) => {
        if (current)
          setSettled({ loader, error: cause instanceof Error ? cause.message : String(cause) });
      });
    return () => {
      current = false;
    };
  }, [loader]);
  const parse = useCallback(
    async (input: string) => (await loader()).default.parse(input),
    [loader],
  );
  const error = settled?.loader === loader ? settled.error : null;
  const status = settled?.loader !== loader ? "loading" : error ? "error" : "ready";
  return { status, error, parse };
}
