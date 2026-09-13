import type { DatasetExample } from "@matchbox-ai/core";
import type { Token } from "@matchbox-ai/core/runtime";
/** Experimental supervision adapter. Application-facing datasets remain input/output JSONL. */
export interface SequenceRecipe {
  tokenizer: "characters" | "words";
  readout: "all" | "last";
  labels: readonly string[];
  annotate(example: DatasetExample<unknown>, tokens: readonly Token[]): readonly (string | null)[];
}
