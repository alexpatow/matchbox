# Browser runtime

```ts
import { matchbox } from "@matchbox-ai/core/vite";
export default { plugins: [matchbox()] };
```

Matchbox uses TensorFlow.js CPU for browser inference. There is no runtime selector or handwritten JS evaluator. Artifacts carry TensorFlow model topology and named weights; the runtime loads them with loadLayersModel and executes model.predict. Matchbox adapts input features and output predictions, validates results, and supports abstention.

Native TensorFlow trains the model. Before export completes, the toolchain captures native predictions and compares them with the serialized model loaded on TensorFlow.js CPU. This checks export fidelity without maintaining a second inference engine.

TensorFlow loads lazily on the first parse. A parser retains its loaded model and exposes dispose(). Shared generated modules live for the application lifetime; the Vite plugin disposes them on HMR. Explicitly created instances should be disposed by their owner. React hooks do not dispose shared model modules when one component unmounts.

Direct creation is available through @matchbox-ai/core/runtime. Inference selects TensorFlow's process-wide CPU backend. Browser apps that separately use TensorFlow should isolate unrelated backend use in another worker. Native training runs through the training toolchain and is kept out of browser entry points.

Artifact format 2 includes the serialized TensorFlow model. Regenerate artifacts produced by earlier versions with matchbox train. apps/benchmarks measures loading and warm inference of the shipped runtime. Cold timing includes lazy TensorFlow loading after the benchmark page itself has loaded. Mobile browser-test profiles emulate device settings on desktop hardware, not physical-phone performance.

Call `await parser.load()` to initialize before the first parse, for example before going offline. The React hook waits for this initialization before reporting `ready`.
