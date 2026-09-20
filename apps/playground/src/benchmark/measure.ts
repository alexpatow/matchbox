import type { MatchboxParser } from "@matchbox-ai/core/runtime";

export async function measure(
  parser: MatchboxParser<unknown>,
  inputs: readonly string[],
  signal?: AbortSignal,
) {
  const timings: number[] = [];
  let accepted = 0;
  let batchStarted = performance.now();
  let batchSize = 0;
  for (let index = 0; index < 320; index++) {
    signal?.throwIfAborted();
    const start = performance.now();
    const result = await parser.parse(inputs[index % inputs.length]!);
    const elapsed = performance.now() - start;
    signal?.throwIfAborted();
    if (index >= 20) {
      timings.push(elapsed);
      if (result.status === "ok") {
        accepted++;
      }
    }
    batchSize++;
    if (index < 319 && (batchSize >= 10 || performance.now() - batchStarted >= 8)) {
      // A new browser task lets input and rendering run; the pause is not timed.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      batchStarted = performance.now();
      batchSize = 0;
    }
  }
  timings.sort((a, b) => a - b);
  return {
    inputs: [...inputs],
    samples: timings.length,
    accepted,
    p50Ms: timings[149]!,
    p95Ms: timings[284]!,
  };
}
