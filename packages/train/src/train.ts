/** Runs the same validation, selection, and packaging pipeline as the CLI. */
export async function train(
  target: string,
  options: { onProgress?: (epoch: number, loss: number) => void } = {},
) {
  const { discover } = await import("./project/index.js");
  const { run } = await import("./run.js");
  return run("train", await discover(target), options.onProgress);
}
