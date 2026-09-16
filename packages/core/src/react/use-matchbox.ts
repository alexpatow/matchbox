import { useCallback, useEffect, useState } from "react";
import type {
  MatchboxParser,
  PartialMatchboxParser,
  PartialParseOptions,
} from "../runtime/index.js";
type State<Parser extends MatchboxParser<unknown>> = {
  status: "loading" | "error" | "ready";
  error: string | null;
  parse: Parser["parse"];
};
export function useMatchbox<Output>(
  loader: () => Promise<{ default: PartialMatchboxParser<Output> }>,
): State<PartialMatchboxParser<Output>>;
export function useMatchbox<Output>(
  loader: () => Promise<{ default: MatchboxParser<Output> }>,
): State<MatchboxParser<Output>>;
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
        if (current) {
          setSettled({ loader, error: null });
        }
      })
      .catch((cause) => {
        if (current) {
          setSettled({ loader, error: cause instanceof Error ? cause.message : String(cause) });
        }
      });
    return () => {
      current = false;
    };
  }, [loader]);
  const parse = useCallback(
    async (input: string, options?: PartialParseOptions) => {
      const parser = (await loader()).default;
      if (options?.allowPartial) {
        if (!("supportsPartial" in parser) || parser.supportsPartial !== true) {
          throw new Error("Partial parsing requires a recurrent model.");
        }
        return (parser as PartialMatchboxParser<Output>).parse(input, options);
      }
      return parser.parse(input);
    },
    [loader],
  );
  const error = settled?.loader === loader ? settled.error : null;
  let status: "loading" | "error" | "ready" = "loading";
  if (settled?.loader === loader) {
    status = error ? "error" : "ready";
  }
  return { status, error, parse };
}
