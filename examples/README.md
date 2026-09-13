# Examples

Every example contains matchbox/<task>/parser.ts, pipeline.ts, data/train.jsonl, and independent evals/validation.jsonl and evals/test.jsonl. Generated artifacts live under the example project’s .matchbox/<task>/ directory. All examples train native TensorFlow weights.

| Example        | Explicit strategy                                             | Limitation                                                                      |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| money-simple   | Word features and field classification.                       | Outputs are restricted to training values; word order is ignored.               |
| money-pipeline | Token supervision and application-owned normalization.        | Broader numeric handling comes from visible decoder code.                       |
| is-even        | Character sequence recognition with a final-position readout. | This is a training control, not a reason to replace ordinary parity arithmetic. |
| filters        | Token recognition followed by a constrained AST compiler.     | The controlled corpus does not establish unrestricted natural-language parsing. |

apps/playground imports these examples’ generated artifacts. apps/benchmarks measures TensorFlow model loading and CPU inference. Runtime confidence is uncalibrated. Schema validation prevents malformed outputs from propagating, while independent evals measure semantic correctness.
