import type { MatchboxParser } from "@matchbox-ai/core/runtime";
export interface TrainingReport {
  parameters: number;
  bytes: number;
  examples: { train: number; eval: number };
  evaluation: { exactAccuracy: number };
  loss: number[];
}
export type ExampleLoader = () => Promise<{
  default: MatchboxParser<unknown>;
  report: TrainingReport;
}>;
