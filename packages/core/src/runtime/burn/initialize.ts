import { load } from "#wasm";
let loading: Promise<void> | undefined;
export function initialize() {
  loading ??= load().catch((error: unknown) => {
    loading = undefined;
    throw error;
  });
  return loading;
}
