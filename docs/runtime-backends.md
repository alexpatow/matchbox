# CPU and WebGPU

Browser inference runs through Burn WASM CPU by default. Recurrent models can explicitly request Burn WebGPU:

```ts
import lexer from "./.matchbox/lexer/model";

const cpu = await lexer.parse(source);
const gpu = await lexer.parse(source, { gpu: true });
```

Both use the same trained weights, decoder and validation. GPU execution does not enable partial results; add `allowPartial: true` separately. Floating-point differences can affect labels and threshold decisions.

## Loading

CPU and GPU runtimes load independently on their first requested parse and are cached per parser. `load()` initializes CPU only. The React hook calls it on mount; for GPU-only use, call the generated parser directly without `load()`.

An unavailable GPU or initialization failure rejects the promise. There is no automatic fallback. Catch the error and retry on CPU if your application wants that behavior. See the [runtime API](reference/runtime.md) for disposal and concurrency.

## Downloads and timing

The GPU runtime is a larger, separate WASM download. Measure initialization, warm inference and total downloaded bytes on your target devices before choosing it. Short inputs may not benefit from GPU execution.

Artifact size excludes runtime assets and authored decoders. Models contain float32 Burn records encoded as base64; quantization is not implemented. TypeScript handles features, decoding, validation and abstention.

Repository contributors can use `apps/benchmarks` to measure loading and warm inference. Its cold timing starts after the page loads. Browser-test mobile profiles run on desktop hardware, so they do not establish physical-phone performance.

## Artifact compatibility

Record classifiers use format 3, fixed-window token classifiers use format 4, and recurrent classifiers use format 5. The runtime also reads format-3 sequence artifacts. Retrain unsupported artifacts with `matchbox-ai train`.

Training uses platform-specific native Burn binaries. See [native package distribution](native-packages.md) for supported platforms. Training dependencies stay out of browser imports.
