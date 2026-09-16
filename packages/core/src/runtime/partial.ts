import type { MatchboxParser, ParseResult } from "./types.js";
export interface UncertainRange {
  start: number;
  end: number;
  confidence: number;
}
/** Candidate output is schema-valid, but uncertain ranges must not be treated as accepted predictions. */
export type PartialParseResult<Output> =
  | ParseResult<Output>
  | {
      status: "partial";
      value: Output;
      confidence: number;
      uncertainRanges: UncertainRange[];
    };
export interface PartialParseOptions {
  allowPartial: boolean;
}
export interface PartialMatchboxParser<Output> extends MatchboxParser<Output> {
  readonly supportsPartial: true;
  parse(input: string): Promise<ParseResult<Output>>;
  parse(input: string, options: PartialParseOptions): Promise<PartialParseResult<Output>>;
}
