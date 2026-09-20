# Date, time, and duration parsing

This repository example trains a token model for durations, relative offsets, and clock times on today or tomorrow. The output stays relative to avoid choosing an application timezone or reference date.

| Input                 | Output                                                      |
| --------------------- | ----------------------------------------------------------- |
| `for 90 minutes`      | `{ kind: "duration", seconds: 5400 }`.                      |
| `in two hours`        | `{ kind: "relative", seconds: 7200 }`.                      |
| `tomorrow at 3:30 pm` | `{ kind: "datetime", dayOffset: 1, hour: 15, minute: 30 }`. |

## Run the example

From the Matchbox repository:

```sh
bun install
bun run build:packages
bun run matchbox train examples/time
bun run matchbox eval examples/time
bun run matchbox dev examples/time
```

The website's [examples page](/examples) runs the exported model. This is a repository example, not a CLI template in 0.1.0.

## What learns, what is code

The model learns quantity, unit, duration/offset cue, day, clock, and meridiem labels from annotated examples. Training-only annotations live in `data/train-spans.json`.

The browser decoder in `decode/` reads those labels, converts digits or a small explicit number-word vocabulary, multiplies units, and validates clock ranges. It can produce numeric amounts absent from training because it copies recognized input spans instead of classifying finite output values.

A duration is elapsed seconds. A relative result is an offset in seconds from a reference instant your app chooses. A datetime result is a local clock time on a relative calendar day. The application must resolve timezone, reference date, and daylight-saving ambiguity. Do not treat a calendar day as a fixed 24-hour offset.

## Limits

This first model covers English seconds, minutes, hours, and elapsed days, up to seven days. The authored quantity helper supports digits, decimals, one through twenty, `a`, `an`, and `half`. Calendar output supports today and tomorrow, 24-hour clocks, and AM/PM.

Weekdays, named months, absolute dates, timezones, recurrence, and fuzzy phrases such as “sometime soon” are outside the example. Unsupported interpretations should return uncertainty. Confidence is uncalibrated, and familiar words in a novel arrangement can still produce a wrong answer.

## Evaluation

The generator writes only training data. Validation, test, and negative challenge fixtures are maintained separately. The test split checks held-out quantities and clock values; all twelve original test inputs have token sequences present in training after numeric normalization. They are regression checks, not evidence of compositional generalization. Training reports include accuracy, loss and export validation. Browser speed is measured by the demo on your device.

The frozen `evals/generalization.json` suite tests new contexts, unit combinations, and rejection cases. Run `bun run eval:examples` after training for accuracy, coverage, and rejection measurements. See [the example audit](../example-evaluation.md).
