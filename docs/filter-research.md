# Historical filter proof findings

This is a historical report for the retired linear prototype. See [the current example audit](example-evaluation.md) for current Burn results and limitations.

This document records BOO-46 before the TensorFlow migration. BOO-47 removes these handwritten trainers and routes filters through the shared neural training path. Current results and limitations are in the [neural training guide](neural-training.md).

The first full toolchain works: examples train a small local model, validation selects a candidate, packaging generates a typed file import, and React uses it to filter a table. This experiment does not yet establish a compelling advantage over a reasonable deterministic parser.

## Reproduction and data

Run `bun run train`, `bun run eval`, `bun run research`, and `bun run test:browser`. The artifact report is generated beside `examples/filters/.matchbox/filters/model.matchbox`; challenge results are in `challenges.report.json`. Browser results are written under `test-results/` and uploaded by CI.

The fixed corpus contains 176 single-clause training examples, 32 validation examples, and 32 evaluation examples across 13 output classes. These cover three statuses, churn exclusion, four countries, five numeric operators, and explicit AND/OR combinations. Examples contain no missing labels and must satisfy the application schema before fitting. All three splits are separate files. Exact input overlap across splits is rejected.

The corpus was assembled locally from a small set of controlled phrase variations. Validation and evaluation contain distinct inputs and unseen combinations/amounts, but share vocabulary and phrase families with training. This is a software integration benchmark, not an independent linguistic generalization study. BOO-35's broader requirement for independent eval templates, dates, ownership, ranges, and adversarial coverage remains open.

The eight additional challenge queries are diagnostic examples, not a second hidden test set. We used them to discover and fix mixed-field partial parses and unsupported negation. They cannot be used as unbiased evidence of the resulting parser's generalization.

## Models and selection

Both candidates use 212 normalized word/bigram features and 13 predicate classes, giving 2,756 weights. Numeric spans are replaced by a shared feature during fitting; their actual values are normalized after recognition. Field-exclusive tokens learned from training reject detected mixed-field clauses. That guard is a heuristic, not a proof that all input semantics were consumed.

Nearest centroid averages and normalizes feature vectors by label. The linear model uses deterministic full-batch softmax regression, zero initialization, 300 training iterations, and a small L2 penalty. Each candidate is quantized to signed int8 values with a shared scale before scoring. The artifact currently stores those integers as JSON, rather than a binary tensor format.

Selection uses validation exact match and serialized artifact size. The initial exploratory 80% requirement chose the centroid model. We raised the example's requirement to 95% after inspecting validation failures, selecting linear regression at a modest size increase. The held-out report is now visible during development, so these results should not be treated as preregistered research.

| Approach         |       Validation exact | Eval exact | Eval abstention | Invalid output | Serialized artifact |
| ---------------- | ---------------------: | ---------: | --------------: | -------------: | ------------------: |
| Nearest centroid |                 81.25% |    84.375% |         15.625% |             0% |        14,597 bytes |
| Linear softmax   |                   100% |       100% |              0% |             0% |        17,090 bytes |
| Rules            | Not used for selection |       100% |              0% |             0% |    No model weights |

The selected artifact SHA-256 is `03ef341142e8b2779a48d1033f58f08ded5e036101bcf72a2a36277f40027cfb`. The generated report records the corresponding data hashes. Package changes or project paths can change the artifact hash; rerun the commands to obtain current results.

Zero invalid output is enforced by deterministic validation. It does not establish semantic accuracy. Confidence bins and individual failures are included in the report. The score uses classification margin and vocabulary coverage; it has not been calibrated as a probability.

## Browser measurements

A local macOS arm64 run used Playwright Chromium, 20 warm-up parses followed by 300 measured parses over three fixed queries per approach. All 300 parses were accepted for each candidate. The desktop result was:

| Approach                   |               Warm p50 | Warm p95 | Module load and initialization |
| -------------------------- | ---------------------: | -------: | -----------------------------: |
| Nearest centroid           |                 0.1 ms |   0.2 ms |                         7.3 ms |
| Linear comparison artifact |                 0.1 ms |   0.2 ms |                         9.2 ms |
| Rules                      | Below timer resolution |   0.1 ms |                         7.4 ms |

The selected parser's initial lazy module load took 39.5 ms; its warm p50/p95 were 0.1/0.2 ms. The mobile viewport run reported 41.3 ms initial loading and the same warm quantiles. Mobile emulation uses the same host CPU and is not a phone hardware benchmark. Comparison modules load later with shared dependencies already warm, so their load times are not directly comparable to initial application loading. Timings include local static asset delivery and are affected by timer precision, JIT, and concurrent test workers.

The Vite build emits the selected model module at about 3.16 KB gzip, with shared runtime and application code separately. The application entry is about 109.4 KB gzip and includes React, Zod, the task definition, and UI code. The raw artifact size is not the total runtime cost. A 64,000-byte artifact limit and a generous 50 ms selected-parser browser p95 limit are enforced as regression budgets.

## The rule comparison matters

The baseline has three anchored recognition regexes after common-word normalization: status, country, and numeric comparison. It uses explicit country/operator maps, three recognition branches, and the same boolean compiler and schema validation as the learned parser. Its current implementation is under 100 lines. It was expanded to cover the authored training language rather than left as a weak straw baseline.

The baseline matches the model's supported eval accuracy and runs faster. On the challenge set it also handles `not active customers`, which the model abstains on because only churn exclusion was trained. Both approaches abstain on the implicit multi-field flagship query. The linear model's successful import and tiny weights do not by themselves demonstrate that it should replace these rules.

## What this establishes

A developer can define a typed task, edit ordinary JSONL examples, run one Bun command, and import a local learned parser without handling tensors, model architecture, or runtime prompts. Quantized learned inference is fast enough here that adding WebGPU has no demonstrated payoff. The API and file-import packaging are ready to support a better parser without changing application call sites.

The next substantive research step is independently authored language data and semantic span classification. It should target implicit conjunctions, operator/value attachment, negation, ranges, dates, and ownership, and measure false acceptance as well as exact match. We should compare that against this clause model and the rule baseline before generalizing the framework or claiming a regex replacement advantage.

## Ticket coverage

BOO-46 delivers this integration proof. It implements the bounded AST, rule baseline, two learned candidates, local runtime, generated wrapper/import, React integration, and training command. It also establishes initial eval and report commands. It leaves BOO-35's independent broad dataset, BOO-37's span-versus-generation comparison, BOO-38's proper calibration, and BOO-43/44's unified component/latency reporting unfinished. The broader tickets should remain open where their acceptance criteria exceed this proof.
