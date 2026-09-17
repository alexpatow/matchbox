# Explicit pipelines

The parser defines valid input and output. The pipeline defines how the model learns. Matchbox requires `pipeline.ts` or `pipeline/pipeline.ts` for conventional tasks; the scaffold writes it visibly.

| Strategy                     | Use when                                                  | Main limitation                                                     |
| ---------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| `fieldClassifier()`          | Outputs are small, finite sets of observed values.        | Cannot produce unseen values; discards word order.                  |
| `tokenClassifier()`          | Local token context and explicit decoding are sufficient. | Uses a fixed context window and whole-result acceptance.            |
| `recurrentTokenClassifier()` | Labels depend on context across a document.               | Predicts one label per text part; requires span-output supervision. |

For the recurrent strategy, follow [the complete authoring guide](primitives/recurrent-token-classifier.md) or [the lexer example](examples/lexer.md). Partial results and GPU parsing are opt-in capabilities of that strategy, not replacements for the existing APIs.

```ts
import { definePipeline, fieldClassifier } from "@matchbox-ai/train";
export default definePipeline({
  prediction: fieldClassifier(),
  acceptance: { minAccuracy: 0.95, maxBytes: 64000 },
});
```

This preset trains the existing bag-of-words MLP. Each output field classifies values observed in training. It cannot emit an unseen numeric value, ignores word order, and may be confidently wrong on new combinations of familiar words. Unknown vocabulary causes abstention. The CLI reports this limitation.

An explicit token pipeline uses application-owned supervision and decoding:

```ts
import { definePipeline, tokenClassifier } from "@matchbox-ai/train";
export default definePipeline({
  prediction: tokenClassifier(),
  acceptance: { minAccuracy: 0.85, maxBytes: 24000 },
});
```

Matchbox discovers `recipe.ts` or `recipe/recipe.ts`, and `decode.ts` or `decode/decode.ts`. Explicit path overrides resolve relative to the task directory. The recipe supplies tokenizer, labels, readout, and annotation alignment. The decoder receives labeled spans and returns a candidate output or null. Matchbox verifies training annotations decode to the supplied training outputs. Recipe code runs during training; decoder code ships with the browser artifact and must remain browser-safe.

These presets remain supported. The separate [recurrent token classifier](primitives/recurrent-token-classifier.md) adds explicit text-part features and context across a document. Decimal codecs, arbitrary graphs, automatic architecture search, and hidden domain normalizers are not implemented. New primitives should demonstrate their limitations and held-out behavior before becoming defaults.

Programmatic training uses await train("money", { onProgress }) from @matchbox-ai/train and follows the same validation and packaging path as the CLI. Importing the authoring helpers does not initialize native Burn; training loads it when invoked.
