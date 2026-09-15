# Example evaluation

The examples are evaluated against expected structured outputs and rejection cases. Timing in the demo measures execution speed on your device, independently of these accuracy checks.

## Current results

These small, synthetic suites are regression evidence. Known failures informed training coverage and candidate selection. The evaluation fixtures were preserved, but their scores are not independent estimates of performance on user traffic. Exact match includes correct abstentions.

| Example | Audit exact match | Language test   | False accepts on audit negatives |
| ------- | ----------------- | --------------- | -------------------------------- |
| is-even | 8/8               | Not applicable. | 0/3                              |
| Money   | 19/20             | 12/12           | 0/8                              |
| Time    | 20/20             | 12/12           | 0/8                              |
| Filters | 16/16             | 11/12           | 0/6                              |

All three language-development suites pass 12/12. No language-test negative case is falsely accepted. Confidence remains uncalibrated.

Money still abstains on “Henrik paid 19 dollars yesterday”. Filters still abstain on “show me all companies based in Norway” in the language test. These are valid requests with incomplete model coverage.

## Training coverage

Money training includes payment framing, subscriptions and bounds that must be rejected rather than returned as exact amounts. Time includes mixed day/hour expressions and sentence framing. Filters include country/location phrasing and exclusion supervision. These are authored training examples; runtime decoders and the model architecture were unchanged.

Two money and six time language-test inputs match training token sequences after numeric normalization. Novel quantities are not necessarily novel model inputs. Even a new full sentence can consist of familiar three-token windows. Country normalization uses an application-owned reference.

## Model size

Sizes include metadata, vocabulary and float32 model records. The shared WASM runtime and application decoders are additional downloads. The website reads these figures from the current build.

| Example | Parameters | Artifact bytes |
| ------- | ---------: | -------------: |
| is-even |        530 |           3898 |
| money   |       1530 |          10351 |
| time    |       1287 |           9188 |
| filters |       7760 |          58555 |

## Reproduce

```sh
bun run train
bun scripts/evaluate-language.ts development
bun scripts/evaluate-language.ts test
bun run eval:examples
bun run test:browser
```

[Current results](example-results.json) include case and artifact hashes, failures and feature-overlap counts. The evaluation scripts write fresh reports into the ignored .matchbox directory.
