import type { DatasetExample } from "@matchbox-ai/core";
import type { Token } from "@matchbox-ai/core/runtime";
/** Experimental supervision adapter. Application-facing datasets remain input/output JSONL. */
export interface SequenceRecipe {
  /** Optional supervised rejection rows. Their annotations must decode to null. */
  rejections?: readonly DatasetExample<null>[];
  /** Train the unknown-token embedding by masking this fraction of training token IDs. */
  tokenDropout?: number;
  tokenizer: "characters" | "words";
  readout: "all" | "last";
  labels: readonly string[];
  annotate(example: DatasetExample<unknown>, tokens: readonly Token[]): readonly (string | null)[];
}
