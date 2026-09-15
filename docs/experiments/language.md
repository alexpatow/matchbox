# Training-language experiment

After completing the Burn migration, this pass changed the money, time and filter training examples. It did not change the three-token architecture, decoder implementations, confidence threshold or epoch count. The goal was to improve recognition through examples rather than add runtime parsing rules.

## Changes

Money training now covers more payment framing, directly adjacent scale/currency phrases, unsupported signed amounts and ranges, and non-currency units. Time adds neutral sentence framing and minutes-plus-seconds compositions. Filters add ordinary query prefixes. Training generators remain in each example's scripts folder; they do not read or write evaluation files.

The original Burn artifacts were saved before augmentation. New language-development and language-test JSONL files were authored before changing the training data. Development results and the existing regression suite informed the changes. A first money candidate improved the language set but failed the existing CLI phrase and unknown-unit checks, so it was rejected and revised. The language test had already been evaluated at that point. Its final scores are a follow-up comparison, not a pristine external holdout estimate. No test rows were copied into training, and no changes were selected against the frozen audit.

The older audit failures were already known from earlier work. That audit now provides regression evidence rather than independent evidence of generalization. All suites are small, hand-authored and synthetic. No statistical significance or production accuracy is claimed.

## Results

Each language suite contains 12 cases per task. Exact match includes correct abstentions. The money test has six negative cases; time and filters each have four.

| Task    | Development before | Development after | Language test before | Language test after | Test false accepts before/after |
| ------- | -----------------: | ----------------: | -------------------: | ------------------: | ------------------------------: |
| Money   |               7/12 |             11/12 |                 7/12 |               12/12 |                             4/0 |
| Time    |              10/12 |             12/12 |                 9/12 |               12/12 |                             0/0 |
| Filters |               7/12 |             12/12 |                 5/12 |               11/12 |                             0/0 |

Money still falsely accepts `budget above 58 euros` in the development set. It returns a single exact amount even though that phrase describes a bound. Passing the test negatives does not establish safe rejection of every unsupported meaning.

Numeric inputs collapse to a shared token. The test suite has two money cases and six time cases equivalent to positive or negative training examples after tokenization. Excluding those cases from both sides of the comparison gives:

| Task    | Before | After |
| ------- | -----: | ----: |
| Money   |   6/10 | 10/10 |
| Time    |    3/6 |   6/6 |
| Filters |   5/12 | 11/12 |

Even whole-sequence novelty is generous: a three-token model can see familiar windows within a novel full sentence. These numbers measure the stated language variations, not general natural-language understanding.

The frozen audit moved from 17/20 to 18/20 for money, 15/20 to 19/20 for time, and 13/16 to 14/16 for filters. Money false accepts fell from two to zero on that audit. Some previously accepted positive inputs now abstain. Confidence remains uncalibrated.

## Reproduction and evidence

Run the ordinary repository check and browser suite first. The language evaluator is separate from the standard CLI regression evaluation:

```sh
bun run check
MATCHBOX_PREBUILT=1 bun run test:browser
bun scripts/evaluate-language.ts development
bun scripts/evaluate-language.ts test
bun run eval:examples
```

The language evaluator writes ignored `.matchbox/language-*.json` reports, including failures, training-feature overlap and artifact/case hashes. Its optional third argument points to a directory of saved `<task>.matchbox` artifacts for before/after comparison. [Recorded results](language-results.json) preserve both sides of this experiment.

The Rust engine tests still require actual learning and identical predictions after serialization. The TypeScript learning check requires a tenfold reduction in epoch-average loss instead of the old hundredfold target: the first epoch averages a different number of optimization steps as the dataset grows, and masking adds ambiguous observations. Existing task-accuracy acceptance thresholds and behavior tests were not weakened.

## Remaining limits

The filter model still abstains on `show me all companies based in Norway` in the language test, and on `hide the churned customers` and `only companies based in Germany` in the audit. Time still abstains on `in two days and four hours`. Money abstains on some payment/subscription framing and has the development false accept above.

A next experiment should use an independently authored batch of application language, measure acceptance accuracy separately from coverage, and compare wider context only if it addresses errors that additional examples cannot resolve. This pass does not establish that a larger architecture is necessary.
