# Training tiny sequence models

BOO-47 routes filters, parity, and money through one TensorFlow sequence trainer under Bun and export them for a separate plain JavaScript browser runtime. The old handwritten centroid and softmax trainers are removed. Deterministic rule parsers remain evaluation baselines. Date/time parsing is the next application after money; this change does not implement it.

## Run the examples

```sh
bun install --frozen-lockfile
bun run train
bun run dev
```

Open <http://127.0.0.1:5173/training>. The page uses the generated artifacts and reports from the local training run. Training runs during startup, before Vite starts. It takes approximately 3 seconds for money on the development machine; this is a measured local observation, not a budget or guarantee.

To run a single task after building packages:

```sh
bun run build:packages
bun run matchbox train examples/is-even/matchbox.config.ts
bun run matchbox train examples/money/matchbox.config.ts
bun run matchbox eval examples/money/matchbox.config.ts
```

`train` reads committed JSONL. To regenerate the synthetic training data explicitly, run `bun examples/is-even/generate.ts` or `bun examples/money/generate.ts`. The money generator does not overwrite the separately authored validation and evaluation files. Both generators are TypeScript and run locally. No teacher service, separate Python training stack, pretrained model, or GPU is needed. The training package installs TensorFlow’s native CPU binding through `@tensorflow/tfjs-node`; its install script is explicitly trusted by Bun.

## Native training backend

The CLI uses `@tensorflow/tfjs-node` 4.22.0 and explicitly selects its `tensorflow` backend. Bun remains the script runner and loads the native binding successfully on the development Mac. Money training measured approximately 39 seconds with the JavaScript CPU backend and 3 seconds with the native backend on the same dataset and machine. There is no silent fallback.

The Node executable on that machine was v26.8.1; a direct native-backend smoke test hit TensorFlow.js's use of the removed `util.isNullOrUndefined` API. The supported training command therefore remains the Bun CLI. Node is used for other build tooling. Native installation and performance must be verified on each supported platform by CI.

## What learns

All three examples use the same architecture: an eight-dimensional learned embedding, a three-token context window, a 16-unit tanh layer, and a softmax label head. TensorFlow.js computes gradients for all parameters using Adam and categorical cross-entropy. The recipe supplies token labels; it does not supply weights. Initializer seeds are 42, 43, and 44. Training uses 55 epochs, batches of 128 supervised token positions, and fixed data order.

Parity tokenizes raw digit strings and supervises only the final token. Its context includes the preceding digit and an end boundary. Generating labels uses modulo at build time; the shipped decoder only maps the predicted EVEN/ODD label to a boolean. This intentionally supplies a useful positional bias. The example does not claim a network learned unrestricted mathematical parity from raw scalar integers.

Money tokenizes words, digit sequences, and punctuation. Every numeric token has the same learned input key, `<number>`, while retaining its original text and offsets for normalization. Labels identify amounts, currencies, thousand/million modifiers, approximation, and neutral text. For example, a number after `invoice` can receive O while a number after `€` receives AMOUNT. The decoder contains no invoice-ID or year regex.

The deterministic decoder supports nonnegative amounts, English decimal notation, correctly grouped comma thousands, English number words below 100, EUR/USD/GBP/SEK, and thousand/million modifiers. It performs arithmetic in minor units and checks the safe-integer bound. A bare `$` is ambiguous and abstains. Locale inference, currency conversion, ranges, negative amounts, arbitrary number-word grammars, and natural-language instructions are outside this example.

## The supervision contract is still experimental

Application-facing records remain `{ input, output }`. For money, the synthetic generator constructs labeled segments alongside each example and writes `data/train-spans.json`. The training-only `recipe.ts` reads those labels. Before fitting, the trainer verifies that decoding the annotations produces the supplied output. Missing or inconsistent supervision fails training.

This is an explicit research adapter, not automatic supervision derived from any arbitrary output schema. Adding handwritten training examples currently requires corresponding token annotations. The money decoder is application-owned and bundled with the artifact import. The next API step should hide reusable recognition recipes behind task capabilities once more than one meaningful parser has demonstrated the abstraction.

```ts
import type { TrainingConfig } from "@matchbox-ai/train";

export default {
  formatVersion: 1,
  task: "./src/task.ts",
  baseline: "./baseline.ts",
  sequence: { recipe: "./recipe.ts", decoder: "./src/decode.ts" },
  train: "./data/train.jsonl",
  validation: "./data/validation.jsonl",
  eval: "./data/evals.jsonl",
  output: "./src/generated/money.matchbox",
  minAccuracy: 0.85,
  maxBytes: 24000,
} satisfies TrainingConfig;
```

## What ships

The `.matchbox` artifact stores a versioned architecture identifier, tokenizer vocabulary, labels, task metadata, readout policy, tensor dimensions, per-tensor quantization scales, and int8 weights. Integer arrays are currently serialized as JSON for inspection, not packed binary. Artifact bytes below include that metadata but exclude the runtime, schema validator, and application decoder.

The Vite plugin turns the artifact into an ESM dependency, imports its task and decoder, validates dimensions, and prepares the portable inference implementation once. Generated declarations preserve the task's output type. A generated `.ts` wrapper supports bundlers without the plugin. TensorFlow.js is external to the training bundle and has no import path into the browser runtime.

```ts
import money from "./generated/money.matchbox";

const result = await money.parse("invoice 31415 totals € 28.65");
// { status: "ok", value: { amount: 28.65, currency: "EUR", approximate: false }, confidence: ... }
```

Unknown tokens and low token confidence cause abstention. The decoder can also decline ambiguous structures. Every accepted candidate passes the application schema. Confidence is an uncalibrated softmax score, and schema validity does not establish semantic correctness.

## Initial measured results

These results were measured locally on macOS arm64 with Bun 1.4.2 and TensorFlow.js 4.22.0. The committed splits and fixed seeds reproduce the artifacts on this environment.

| Measurement                             | Parity |    Money |
| --------------------------------------- | -----: | -------: |
| Training examples                       |    400 |    1,596 |
| Validation examples                     |    100 |       20 |
| Evaluation examples                     |    100 |       24 |
| Trainable parameters                    |    530 |    1,041 |
| Artifact bytes                          |  2,802 |    4,920 |
| Untrained, ungated exact accuracy       |    39% |       0% |
| Shuffled-label control, ungated         |    40% | Not run. |
| Trained float evaluation accuracy       |   100% |     100% |
| Trained int8 evaluation accuracy        |   100% |     100% |
| Deterministic baseline accuracy         |   100% |    87.5% |
| Correct abstentions on challenge inputs |    7/7 |    14/14 |

The first and final training losses were approximately 0.690 and 0.00000116 for parity, and 0.881 and 0.0000521 for money. The untrained and shuffled controls use a zero confidence threshold so abstention gating cannot manufacture the comparison. Ordinary runtime evaluation retains the 0.75 threshold. The shuffled control preserves the label counts and changes their association with training inputs.

Export verification compares the independent float runtime with TensorFlow on the first 16 training inputs plus every validation input. There were zero label disagreements; maximum top-label probability error was below 0.000001. Float and quantized structured results are evaluated separately after the validation gate. Build reports include loss history, failures, dataset and artifact hashes, confidence error, and size.

The money baseline misses the three examples with another number used as an invoice ID, year, or order number. This baseline could be extended with a few context rules. The comparison demonstrates that this model learned the distinction, not that the model has established a compelling maintenance advantage over rules.

## Filter migration

The filter example now uses the same native TensorFlow trainer and portable sequence runtime. Its build-only recipe supplies weak semantic token labels, and its deterministic decoder constructs the bounded application AST. The handwritten training implementations and predicate-template artifact format are removed.

The training file now contains 408 records: the original 176, 160 currency/scale variations, and 72 explicit compositions. The existing 32 validation and 32 evaluation records were preserved. Those evaluation inputs were already known from BOO-46, so this is a compatibility check rather than a new blind benchmark. The model has 1,219 parameters and a 9,224-byte artifact. Both the neural model and rules score 100% on that evaluation set. Initial/final training loss was approximately 2.065/0.000484, with zero export label disagreements.

## Evaluation limits and next experiments

Money's 24 evaluation examples were authored separately from its generator, with unseen numeric values and number-word combinations. Their language vocabulary and several construction patterns remain close to training. They were examined during development and are not an independent benchmark. Several challenge rejections come directly from the unknown-token policy. Broader language support and calibrated uncertainty remain open work.

Parity's longer strings test a local final-digit rule; they do not establish general sequence reasoning. One initializer configuration and one architecture are used here. We have not performed multi-seed selection, broader architecture search, or a money shuffled-label control.

The next useful experiment is a larger independently authored money corpus with held-out phrase families and ambiguous context. Compare it with a stronger rule baseline and other sequence architectures. Once that holds up, add bounded date/time recognition with explicit reference time, timezone, and locale, keeping calendar arithmetic deterministic.

`bun run test:browser` tests the actual production bundle at desktop and mobile Chromium viewport sizes. It blocks requests after model loading, exercises the parsers, and records 300 warm samples after 20 warmups. It writes measurements and screenshots under `test-results/`. A mobile viewport runs on the same host CPU and is not a physical phone benchmark.

The final local desktop Chromium run measured approximately 0.1 ms warm p95 for money, parity, and filters, with all 300 parses accepted per benchmark. The median fell below the browser timer's resolution. The filter model's initial module load and initialization measured 47.3 ms, including local static asset delivery. These are local observations; CI records its own results.

## References

[TensorFlow.js training documentation](https://www.tensorflow.org/js/guide/train_models) describes the training and automatic differentiation APIs. The [vGPU WGSL package](https://github.com/vercel-labs/vgpu/tree/main/packages/wgsl) inspired treating model files as typed bundler modules. Matchbox implements its own `.matchbox` loader and portable inference; it does not depend on vGPU.
