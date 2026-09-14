# Example evaluation

This audit measures model accuracy, coverage, rejection behavior and browser performance. It exposes remaining semantic errors, including a misclassified time unit and an incorrectly accepted negative money amount.

## Harder scenarios

The customer demo now includes `German or Swedish customers under 50k except churned ones`. It requires sharing ARR and status restrictions across two country alternatives. The model recognizes field/value/operator tokens; the application decoder constructs that boolean structure. The compiler contributes the compositional behavior.

Money includes `invoice 31415 totals € 28.65` and `in 2026 we paid USD 59.20`. The model labels invoice/year numbers as neutral and the payment as an amount. The decoder converts the recognized amount.

Parity remains a training sanity check. Use deterministic arithmetic in an application.

## Frozen synthetic audit

Measured on 14 September 2026. These are small hand-authored synthetic suites, not user traffic or an externally authored benchmark. They were kept out of training and model selection. The model was then frozen; the failures below were not added to training. Existing validation/test fixtures were used during development and are described as regressions.

Exact match includes correct abstentions on negative inputs. Accepted accuracy measures the outputs that would reach an application. None failed output schema validation; semantic mistakes still occurred.

| Example | Model exact | Accepted accuracy | False accepts on negatives |
| ------- | ----------- | ----------------- | -------------------------- |
| is-even | 8/8         | 5/5               | 0/3                        |
| money   | 19/20       | 12/13             | 1/8                        |
| time    | 15/20       | 7/8               | 0/8                        |
| filters | 13/16       | 7/7               | 0/6                        |

## Feature overlap

All word-mode numbers become `<number>`. A new amount can therefore produce an input sequence already used in training. Such a case checks copying and normalization rather than a newly learned interpretation.

| Example | Original regression inputs equivalent to training | Audit inputs equivalent to training | Neural exact on feature-novel audit inputs |
| ------- | ------------------------------------------------- | ----------------------------------- | ------------------------------------------ |
| is-even | 0/100                                             | 1/8                                 | 7/7                                        |
| money   | 13/27                                             | 1/20                                | 18/19                                      |
| time    | 12/12                                             | 3/20                                | 12/17                                      |
| filters | 0/282                                             | 1/16                                | 12/15                                      |

A whole-sequence novelty check is still generous to these models. Their receptive field is only three tokens, so a new whole input can consist entirely of familiar local windows. Filter labels are supplied by a training lexicon, and the decoder uses a shared country reference. The task does not establish learned geographical knowledge.

## Observed failures

- `a price of minus seventeen euros`: It returns `{"amount":17,"currency":"EUR","approximate":true}`. The recognition score is 0.9982.
- `set a timer for eleven minutes and 9 seconds`: It returns `{"kind":"duration","seconds":39609}`. The recognition score is 0.8302.
- `could you remind me in 28 minutes`: It abstains. The recognition score is 0.8950.
- `start the timer for 43 seconds`: It abstains. The recognition score is 0.8017.
- `the meeting is tomorrow at 8 pm`: It abstains. The recognition score is 0.8950.
- `we will meet today at 14:26`: It abstains. The recognition score is 0.7104.
- `give me customers from Sweden`: It abstains. The recognition score is 0.0000.
- `hide the churned customers`: It abstains. The recognition score is 0.0000.
- `only companies based in Germany`: It abstains. The recognition score is 0.0000.

The money error accepts an unsupported negative amount as positive money. The time error confuses minutes with hours. Both outputs satisfy their schemas. Raising the money threshold to 0.99 still accepts the wrong answer while reducing accepted coverage to 8/20. Confidence is not calibrated correctness, and a threshold alone does not solve this problem.

The money development regression suite also retains two abstentions: `we paid around 91 euros` and `the budget is about 63 thousand kronor`. The result is 25/27, not a rounded claim of perfect parsing. `send 15 euros to Alice` was moved from negative challenges into the positive regression file because the previous annotation was wrong.

## Training changes and ownership

Money and time now include explicit negative training rows and courtesy/punctuation contexts. Their recipes opt into 0.01 token masking, which supervises the unknown embedding instead of rejecting every unfamiliar token at the vocabulary boundary. Filters and parity retain the closed-vocabulary policy. Unknown-token support can help unfamiliar names while also permitting unknown semantic cues to be overlooked, as the money failure shows.

Masking at 0.05 and 0.15 produced regressions during development. A 16-dimensional embedding with a 32-unit hidden layer did not resolve the money failures and exceeded the filter artifact budget. The shipped network retains an 8-dimensional embedding, a 16-unit hidden layer, and a three-token window. Training uses deterministic minibatch ordering, Adam at 0.005, and 55 epochs. The broader comparison is not an AutoML result or a multi-seed study.

The model predicts labels. Application code still owns English number conversion, unit arithmetic, currency normalization and filter grammar. Rejection labels are also application-owned. No domain dictionary was added to the framework runtime.

## Reproduce

```sh
bun install
bun run train
bun run eval:examples
bun run test:browser
```

The audit writes `.matchbox/example-evaluation.json` with every prediction, failure, score, slice, threshold comparison and source hash. Generated model artifacts remain ignored. Generators write training data only; keep `evals/generalization.json` frozen. Future training informed by these failures requires a new independent audit before claiming generalization gains.

| Example | Artifact SHA-256                                                   | Audit source SHA-256                                               |
| ------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| is-even | `91fc70e15ff99d2eb3f0d05316ff3c39f62c169b12a14d4b123489fe6cb1312b` | `93cff9748ccc3ce575274f04dec41861ac59f7bcdd42d35bbcfe86f026774177` |
| money   | `3a16db15e1117dca72ff07d5c79cf97ee439815614030a1152c4c1d65124aef1` | `c8b46c03eee72e24e8a297771cb8c7b026c9f3de31c2ea1822e681c87458e234` |
| time    | `b1c93782abda06d7a7da0b4510471cc140a734df66f8de2669601999d70f5997` | `9735ba19d8feb772fa074a0cbee03cb7d8b6fb009bdb734d0128a0836739487f` |
| filters | `7a084cd990871108cd907e5cfbd71e7bf84dedbd763d8061c8650c5da4a635ce` | `5c47c1e8b9cca57c904a21523a7f975ced84cbc418af12afd4e38ea2e3f0203c` |

## Artifact cost

These sizes include model topology, vocabulary, metadata and JSON int8 weight arrays. TensorFlow expands weights to floating point for execution. They exclude the shared TensorFlow runtime and application decoder, so they are not the total download cost.

| Example | Parameters | Artifact bytes | Artifact gzip bytes |
| ------- | ---------- | -------------- | ------------------- |
| is-even | 530        | 4,477          | 1,807               |
| money   | 1,178      | 7,230          | 2,989               |
| time    | 1,159      | 7,654          | 3,002               |
| filters | 7,680      | 41,260         | 12,859              |

The playground's shared TensorFlow JavaScript chunk is 507,669 bytes minified, or 138,264 bytes with gzip, in addition to the artifacts above. This excludes other application code and decoders. Browser benchmarks measure initialization and warm inference separately; warm sub-millisecond timings do not include downloading or parsing the shared runtime.

## Browser measurements

One Playwright run on an Apple M2, with desktop Chromium and a Pixel 7 viewport emulated on the same host, produced the following money-runtime measurements. These are local measurements, not mobile hardware results. Each warm measurement uses 20 warmups and 300 timed calls across the 27 regression inputs, including their two abstentions.

| Browser profile           | First parse including model initialization | Warm p50 | Warm p95 |
| ------------------------- | ------------------------------------------ | -------- | -------- |
| Desktop Chromium          | 64.8 ms                                    | 0.1 ms   | 0.3 ms   |
| Mobile Chromium emulation | 45.3 ms                                    | 0.1 ms   | 0.3 ms   |

First-parse timing begins after the benchmark page's static modules have loaded. It includes JSON parsing, parser creation, TensorFlow initialization and inference, but excludes the page and module downloads. Browser timer granularity limits the precision of warm measurements.

The filter benchmark's three fixed regression queries measured 0.2 ms p50 and 0.7 ms p95 on desktop. These timings do not measure the full generalization suite. The browser tests also verified matching exported outputs and continued inference with networking blocked.

## Next evaluation

Use successive, independently held-out batches of application language. Track how much coverage improves through new examples while the decoder remains stable. Measure positive coverage, incorrect accepted answers, artifact size, latency and the amount of authored code needed to support new phrasing. The remaining unit and sign errors are concrete targets for further training research.
