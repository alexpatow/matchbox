import type { MatchboxParser } from "@matchbox-ai/core/runtime";
export interface TrainingReport {
  bytes: number;
}
export type ExampleLoader = () => Promise<{
  default: MatchboxParser<unknown>;
  report: TrainingReport;
}>;
