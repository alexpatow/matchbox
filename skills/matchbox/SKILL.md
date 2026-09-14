---
name: matchbox
description: Author, train, evaluate, and integrate tiny browser-local Matchbox parsers using explicit TypeScript primitives.
---

# Matchbox

Read the installed package docs/README.md first, then project-structure.md, pipelines.md, evaluation.md, and primitives/README.md. In the framework repository, use root docs/. Match examples to the installed version.

1. Inspect parser.ts, pipeline.ts, data/train.jsonl, and independent evals before changing behavior.
2. Keep the output schema focused on valid application values. Make representation and supervision choices explicit in pipeline.ts or imported helpers.
3. Use fieldClassifier for finite output domains and tokenClassifier for explicitly supervised token recognition. Explain their limits; do not promise unseen numeric outputs from a finite classifier.
4. Keep domain dictionaries and normalizers application-owned and visible. Never insert one silently to make an evaluation pass.
5. Fit preprocessing only on training data. Put data generators in project-level scripts/ and preserve validation/test fixtures. Add meaningful held-out compositions and negative cases independently of model fitting.
6. Use the CLI from @matchbox-ai/cli or programmatic train from @matchbox-ai/train to apply validation gates, measure results, and package weights. Report failures honestly. Never fabricate benchmark figures.
7. Distinguish uncertain interpretation from invalid user input. Confidence is currently uncalibrated; inspect diagnostics before attributing uncertainty to one cause.
8. Import generated artifacts in the app and use @matchbox-ai/core/react when needed. Keep @matchbox-ai/train and native TensorFlow outside browser code.
9. Let TensorFlow serialize, load, and execute models. Do not implement custom inference kernels or a backend-selection framework. Verify native-to-browser export parity and benchmark the shipped TensorFlow runtime. Label emulated mobile measurements accurately.

Scope changes to existing, documented primitives. Propose a new primitive separately with its contract, limitations, and evaluation evidence. Preserve authored code and tests when reorganizing folders.

Matchbox owns authoring, workflows, evals, packaging, validation, and typed results. TensorFlow owns model execution. A schema must never silently select numeric encodings or domain normalizers.
