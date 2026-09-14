import type { DatasetExample } from "@matchbox-ai/core";
import type { SequenceRecipe } from "@matchbox-ai/train";
import type { SequenceDecoder, MatchboxParser } from "@matchbox-ai/core/runtime";
import { tokenize } from "@matchbox-ai/core/internal";
/** An empirical token/window classifier trained on exactly the network's supervision. */
export function lookup(
  examples: readonly DatasetExample<unknown>[],
  recipe: SequenceRecipe,
  decode: SequenceDecoder,
): MatchboxParser<unknown> {
  const windows = new Map<string, Map<string, number>>();
  const words = new Map<string, Map<string, number>>();
  const key = (tokens: { key: string }[], i: number) =>
    JSON.stringify([tokens[i - 1]?.key ?? null, tokens[i]!.key, tokens[i + 1]?.key ?? null]);
  const add = (table: typeof words, key: string, label: string) => {
    const counts = table.get(key) ?? new Map<string, number>();
    counts.set(label, (counts.get(label) ?? 0) + 1);
    table.set(key, counts);
  };
  for (const row of examples) {
    const tokens = tokenize(row.input, recipe.tokenizer);
    recipe.annotate(row, tokens).forEach((label, i) => {
      if (label === null) return;
      add(windows, key(tokens, i), label);
      add(words, tokens[i]!.key, label);
    });
  }
  return {
    async parse(input) {
      const tokens = tokenize(input, recipe.tokenizer);
      const tagged = tokens.map((token, i) => {
        const counts = windows.get(key(tokens, i)) ?? words.get(token.key);
        const entries = [...(counts ?? [])].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        return {
          ...token,
          label: entries[0]?.[0] ?? "",
          confidence: entries.length ? entries[0]![1] / entries.reduce((s, e) => s + e[1], 0) : 0,
        };
      });
      const relevant = recipe.readout === "last" ? tagged.slice(-1) : tagged;
      const confidence = relevant.length ? Math.min(...relevant.map((t) => t.confidence)) : 0;
      const value = confidence >= 0.75 ? decode(tagged, input) : null;
      return value == null
        ? {
            status: "uncertain",
            value: null,
            confidence,
            reason: "Insufficient empirical support.",
          }
        : { status: "ok", value, confidence };
    },
  };
}
