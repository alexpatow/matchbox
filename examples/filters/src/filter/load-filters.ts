let pending: ReturnType<typeof importModel> | undefined;
let coldLoadMs = 0;
async function importModel() {
  const start = performance.now();
  const module = await import("../generated/filters.matchbox");
  coldLoadMs = performance.now() - start;
  return module;
}
export function loadFilters() {
  return (pending ??= importModel().catch((error) => {
    pending = undefined;
    throw error;
  }));
}
export function modelLoadTime() {
  return coldLoadMs;
}
