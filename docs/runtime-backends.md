# Runtime execution

Matchbox uses Burn for native training and browser inference. The Rust workspace contains the shared model implementation, a Node-API adapter for training, and a WebAssembly adapter for inference. There is no public backend selector or handwritten JavaScript evaluator.

Both sequence parsers and structured-record classifiers export float32 Burn records. TypeScript handles input features, authored output transformations, validation and abstention. Native/WASM prediction checks verify serialization fidelity before export completes.

The runtime loads lazily on the first parse. A parser retains its loaded model and exposes dispose(). Shared generated modules live for the application lifetime; the Vite plugin disposes them on HMR. Explicitly created instances should be disposed by their owner. React hooks do not dispose shared model modules when one component unmounts.

Direct creation is available through @matchbox-ai/core/runtime. Imports are SSR-safe; browser loading uses a separate WASM asset. Node inference reads that asset from the installed package. Training dependencies stay out of browser entry points.

Artifacts contain base64-encoded Burn records. Record classifiers use format 3, fixed-window token classifiers use format 4, and recurrent token classifiers use format 5. The runtime retains support for format-3 sequence artifacts. Regenerate older artifacts with matchbox-ai train. The report evaluates the trained artifact once under `evaluation`. Quantization is not implemented.

The training package bundles platform-specific native binaries. See [native package distribution](native-packages.md) for the verified support matrix. Repository contributors should follow [contributor setup](contributing.md).

apps/benchmarks measures loading and warm inference of the shipped runtime. Cold timing includes lazy WASM loading after the benchmark page itself has loaded. Mobile browser-test profiles emulate device settings on desktop hardware, not physical-phone performance.
