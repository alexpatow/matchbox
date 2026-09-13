# Evaluation

Training fits vocabulary, field domains, and weights using data/train.jsonl only. Validation in evals/validation.jsonl gates artifact export. Independent evals/test.jsonl measures the selected model. Input overlap across these splits is rejected.

Run matchbox eval money to evaluate saved artifacts without retraining or requiring the training data. A failing accuracy threshold produces a nonzero exit code. Optional evals/baseline.ts exports a parser with the same parse contract. Optional evals/challenges.json contains abstention cases with input and output: null. Other research formats must have distinct filenames and explicit runners.

Reports include accuracy, abstention, invalid-output rate, artifact bytes, loss, export parity, dataset hashes, and control-model results where supported. Confidence is uncalibrated. Zero confidence for unfamiliar vocabulary means the current model declines to answer; it does not prove the input is invalid or diagnose the only cause.

When evaluating new numeric representations, withhold complete output values and meaningful input compositions. Never teach test answers through a dictionary or rewrite evals to make training pass. Schema validity establishes output shape, not semantic correctness.
