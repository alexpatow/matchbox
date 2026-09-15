# Sequence export parity

The independent lexer consumer's full-clean-v1 corpus contains 4,174 training records and 12,245,833 UTF-16 units. Published Matchbox 0.2.1 completed native fitting but failed export verification after 522.663 seconds of CLI wall time. The consumer did not receive a new artifact. The original 0.00001 confidence cutoff rejected this run.

A separate framework diagnostic using the exact published native and WASM binaries preserved weights before checking the same first 16 training records and all 336 validation records. The model had 12,625 parameters, vocabulary size 1,507, and 12,245,739 supervised Unicode code points. Across 945,166 probe tokens it produced zero label disagreements; maximum absolute confidence drift was 0.00001537799835205078. One repeated case was native 0.6656225323677063 versus WASM 0.6656074523925781, both labeled number. This is a measured probability difference, not evidence of incorrect weight serialization.

The sequence guard now allows at most 0.0001 absolute confidence drift, or 0.01 percentage points. This is an explicit numerical tolerance, separate from the model's unchanged 0.75 acceptance threshold. Every label disagreement still fails. Any confidence difference crossing the acceptance threshold now also fails, even when smaller than the numerical tolerance. The report retains the actual maximum drift, tolerance, token count, label disagreements and acceptance disagreements. Record-model verification is unchanged.

Replaying the preserved full model passed this guard with zero label disagreements and zero acceptance disagreements. This verifies the correction on the failed case without retraining or changing weights. It does not establish accuracy or guarantee parity outside the probes. No test-set labels were used to choose model settings or this tolerance.

## Reproduce a framework diagnostic

From the framework repo, run:

```sh
bun scripts/diagnose-sequence-export.ts \
  /path/to/matchbox-lexer \
  /path/to/matchbox-lexer/matchbox/lexer \
  /path/to/matchbox-lexer/data/generated/full-clean-v1 \
  .matchbox/parity-diagnostic-new
```

An optional final integer limits training records for a bounded diagnostic. A 64-record run and a 512-record run both passed the original tolerance, so they do not reproduce the full failure. The runner refuses an existing output directory and saves model.json and fit.json before verification. It loads the specified consumer's installed native binary and WASM implementation. This intentionally uses framework internals for diagnosis; it is not a public consumer pipeline example or a successful published-package benchmark. Outputs stay ignored.

The diagnostic fit stage took 496.076 seconds, including argument conversion and the native fit. The original public CLI failed before persisting native-only time, so that value must not be substituted into its historical report. The consumer must retry with a corrected published release before claiming an end-to-end full-corpus result.
