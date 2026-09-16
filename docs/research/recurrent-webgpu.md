# Recurrent WebGPU evaluation

Recurrent parsers can request Burn WebGPU with `parse(input, { gpu: true })`. CPU remains the default, and the GPU runtime loads separately. The [API contract](../primitives/recurrent-token-classifier.md#optional-webgpu-execution) describes availability errors, partial parsing and lifecycle behavior.

This evaluation uses the existing 36,233-parameter checkpoint and the pinned `gpu-lexer@0.0.2` reference. It does not use a newer upstream model. All 336 frozen validation documents contribute 750,030 non-whitespace Unicode code points. Training and compilation had finished before timing. The machine was an Apple M2 with 8 GiB RAM, running headed Chromium 153.

## Quality and performance

| Measurement                               | GPU-lexer 0.0.2 |    Matchbox CPU | Matchbox WebGPU |
| ----------------------------------------- | --------------: | --------------: | --------------: |
| Non-whitespace agreement                  |          70.88% |          77.57% |          77.57% |
| Returned-candidate coverage               |            100% |         99.996% |         99.996% |
| Styled macro F1                           |          54.56% |          65.56% |          65.56% |
| First parse, including dynamic loading    |        190.7 ms |        131.6 ms |        347.0 ms |
| First corpus pass p50                     |          1.1 ms |          5.8 ms |          5.2 ms |
| First corpus pass p95                     |          3.1 ms |         53.7 ms |         17.3 ms |
| Repeated corpus pass p50                  |          1.0 ms |          6.0 ms |          4.0 ms |
| Repeated corpus pass p95                  |          2.8 ms |         57.5 ms |         14.7 ms |
| Fetched JavaScript and WASM, uncompressed |    63,844 bytes | 1,095,146 bytes | 7,430,739 bytes |
| Same assets, independently gzipped        |    35,408 bytes |   384,464 bytes | 1,491,300 bytes |

Matchbox uses `allowPartial: true` for both runtimes. Returned-candidate coverage includes uncertain spans and is not confident coverage. Scores count abstentions as incorrect. The reference returns unconditional candidates. Higher aggregate agreement does not imply superiority on every language or label; for example, reference function F1 is 74.18%, versus 56.22% for this Matchbox checkpoint.

Each engine runs in a fresh browser context. Initialization includes the first parse of `const answer = 42;`. After 20 warmup documents, the runner measures every validation document once, then repeats the corpus. Timing includes encoding, inference, decoding and validation. OS shader caches are not cleared, and first-pass timings can include compilation for new shapes. Download totals include the benchmark harness and model dependencies; gzip totals are computed from asset bodies, not observed compressed network transfer.

WebGPU improves long-document latency but does not establish parity with GPU-lexer. The runtime download is substantially larger, and both first-pass and repeated p95 remain slower. These are desktop results, not physical-phone measurements.

The [machine-readable report](recurrent-webgpu.json) includes asset hashes, reference and dataset identities, per-language scores, confusion matrices and CPU/GPU comparison counts. Document result statuses agree on all 336 examples. Two documents have different uncertain-range boundaries because floating-point differences cross the confidence threshold. Their decoded values agree. The maximum difference in reported document confidence is 0.000005365. Confidence remains uncalibrated, and exact uncertainty boundaries are not guaranteed across devices.

## Validation-only training experiments

Two additional runs retain the architecture, full training corpus, seed 42, eight epochs and 4,096-part padded batch budget. Both use an epoch-wise cosine learning rate from 0.003 to 0.0001. The second normalizes each supervised part's class-count target to sum to one. Both still evaluate using the original code-point-weighted metric. Neither run reads test examples or changes the published training contract.

| Training configuration            | Selected epoch | Validation agreement | Styled macro F1 | Training and validation wall time |
| --------------------------------- | -------------: | -------------------: | --------------: | --------------------------------: |
| Existing constant-rate checkpoint |              3 |               77.57% |          65.56% |                          899.47 s |
| Cosine rate, code-point weighting |              3 |               77.33% |          65.14% |                        1,112.70 s |
| Cosine rate, equal-part weighting |              7 |               78.08% |          65.85% |                        1,216.53 s |

The new runs overlapped other work, so their durations are recorded costs rather than speed comparisons. A single seed and a 0.51-point validation improvement do not establish a general quality improvement. The browser table deliberately retains the existing checkpoint to isolate runtime behavior.

## Reproduction

Use the frozen data preparation described in [the part-model experiment](sequence-parts.md). The research executable accepts `cosine-validation` or `part-cosine-validation` as its optional fifth argument. Both modes stop after validation checkpoint selection.

For browser comparisons, provide a trained task directory containing `output/model.matchbox`, its generated `output/model.ts` wrapper and authored decoder dependencies. The runner requires the installed reference package to be exactly version 0.0.2 and writes a new report without overwriting previous evidence.

```sh
bun apps/benchmarks/scripts/compare-lexer.ts \
  "$TRAINED_TASK" "$FROZEN_CORPUS" "$GPU_LEXER_PACKAGE" \
  .matchbox/validation-comparison.json validation
```
