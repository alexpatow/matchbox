export interface Predicate {
  field: string;
  operator: string;
  value: string | number | boolean;
}
export type FilterExpression =
  | Predicate
  | { and: Predicate[] }
  | { or: (Predicate | { and: Predicate[] })[] };
export type ParseResult<Output> =
  | { status: "ok"; value: Output; confidence: number }
  | { status: "uncertain"; value: null; confidence: number; reason: string };
export interface MatchboxParser<Output> {
  load?(): Promise<void>;
  parse(input: string): Promise<ParseResult<Output>>;
}
