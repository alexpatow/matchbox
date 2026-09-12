import type { ValidationIssue } from "../parser/index.js";

export interface DatasetExample<Output> {
  readonly input: string;
  readonly output: Output;
}

export interface DatasetSource {
  /** A filename or label used in diagnostics. No file is read by this API. */
  readonly source: string;
  readonly text: string;
}

export interface DatasetConfig {
  readonly formatVersion: 1;
  readonly train: DatasetSource;
  readonly eval: DatasetSource;
}

export interface DatasetIssue extends ValidationIssue {
  readonly split: "train" | "eval";
  readonly source: string;
  /** Physical, one-based line number. Empty sources report line 1. */
  readonly line: number;
}

export type DatasetResult<Output> =
  | {
      readonly success: true;
      readonly data: {
        readonly train: readonly DatasetExample<Output>[];
        readonly eval: readonly DatasetExample<Output>[];
      };
    }
  | { readonly success: false; readonly issues: readonly DatasetIssue[] };
