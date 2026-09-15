# Authoring primitives

Import these from @matchbox-ai/train:

| Primitive       | Contract                                                                                |
| --------------- | --------------------------------------------------------------------------------------- |
| definePipeline  | Validates an explicit pipeline declaration and acceptance thresholds.                   |
| fieldClassifier | Selects independent categorical output heads over training values.                      |
| tokenClassifier | Selects the sequence trainer with conventionally discovered recipe and decoder modules. |
| tokenize        | Shares the portable tokenizer with annotation generators.                               |
| train           | Runs project discovery, native training, validation, and packaging.                     |
| evaluate        | Evaluates a parser against examples and a supplied output-validation function.          |
| SequenceRecipe  | Types application-owned sequence supervision.                                           |
| OutputDecoder   | Types a browser-safe sequence-to-output decoder.                                        |

The field classifier derives its field names and value domains from training outputs. The output schema still independently validates predictions. The sequence recipe owns tokenization, so it cannot also specify a separate input encoder.

Tensor shapes, exported weight readers, and architecture-specific predictors belong to @matchbox-ai/core/internal. That subpath supports coordinated framework packages and research tests; application code should use the documented task, pipeline, and runtime interfaces.

See [token supervision](../reference/supervision.md) for explicit rejection examples and optional training token masking.
