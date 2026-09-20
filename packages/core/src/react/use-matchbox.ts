import { useCallback, useEffect, useState } from "react";
import type { MatchboxParser, PartialMatchboxParser, GpuParseOptions } from "../runtime/index.js";
type State<Parser extends { parse: unknown }> = {
  status: "loading" | "error" | "ready";
  error: string | null;
  parse: Parser["parse"];
};
export function useMatchbox<Output>(
  loader: () => Promise<{ default: PartialMatchboxParser<Output> }>,
): State<PartialMatchboxParser<Output>>;
export function useMatchbox<Output, Input = string>(
  loader: () => Promise<{ default: MatchboxParser<Output, Input> }>,
): State<MatchboxParser<Output, Input>>;
/** Keep the loader outside the component so its identity remains stable. */
export function useMatchbox<Output, Input = string>(
  loader: () => Promise<{ default: MatchboxParser<Output, Input> }>,
) {
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
    async (input: Input, options?: GpuParseOptions & { allowPartial?: boolean }) => {
      const parser = (await loader()).default;
      if (options?.allowPartial || options?.gpu) {
        if (
          typeof input !== "string" ||
          !("supportsPartial" in parser) ||
          parser.supportsPartial !== true
        ) {
          throw new Error("GPU and partial parsing require a recurrent model.");
        }
        const recurrent = parser as unknown as PartialMatchboxParser<Output>;
        if (options.allowPartial) {
          return recurrent.parse(input, { ...options, allowPartial: true });
        }
        return recurrent.parse(input, options);
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
