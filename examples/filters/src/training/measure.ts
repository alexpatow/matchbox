import type { MatchboxParser } from "@matchbox-ai/core/runtime";
export async function measure(parser: MatchboxParser<unknown>, input: string) {
  for (let index = 0; index < 20; index++) await parser.parse(input);
  const timings: number[] = [];
  let accepted = 0;
  for (let index = 0; index < 300; index++) {
    const start = performance.now();
    const result = await parser.parse(input);
    timings.push(performance.now() - start);
    if (result.status === "ok") accepted++;
  }
  timings.sort((a, b) => a - b);
  return { samples: timings.length, accepted, p50Ms: timings[149]!, p95Ms: timings[284]! };
}
