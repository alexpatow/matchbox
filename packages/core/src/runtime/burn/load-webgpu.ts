import init, { initialize } from "../../../wasm/matchbox_webgpu.js";
let loading: Promise<unknown> | undefined;
export async function loadWebGpu() {
  const navigator = globalThis.navigator as Navigator & {
    gpu?: { requestAdapter(): Promise<unknown | null> };
  };
  if (!navigator?.gpu || !(await navigator.gpu.requestAdapter())) {
    throw new Error("WebGPU is unavailable. Use a supported browser or omit gpu: true.");
  }
  loading ??= init({ module_or_path: new URL("./matchbox_webgpu_bg.wasm", import.meta.url) })
    .then(() => initialize())
    .catch((error: unknown) => {
      loading = undefined;
      throw error;
    });
  await loading;
}
