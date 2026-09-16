import type { PartialMatchboxParser } from "@matchbox-ai/core/runtime";
interface Span {
  type: string;
  start: number;
  end: number;
}
interface Example {
  input: string;
  output: Span[];
}
/** Measures the application API. It does not treat abstentions as correct predictions. */
export async function measureRecurrent(parser: PartialMatchboxParser<Span[]>, rows: Example[]) {
  const cold = performance.now();
  await parser.parse(rows[0]!.input, { allowPartial: true });
  const coldFirstParseMs = performance.now() - cold;
  for (const row of rows.slice(0, 20)) {
    await parser.parse(row.input, { allowPartial: true });
  }
  const timings: number[] = [];
  const statuses = { ok: 0, partial: 0, uncertain: 0 };
  let characters = 0,
    candidateCharacters = 0,
    correct = 0,
    covered = 0,
    coveredCorrect = 0;
  for (const row of rows) {
    const tick = performance.now();
    const result = await parser.parse(row.input, { allowPartial: true });
    timings.push(performance.now() - tick);
    statuses[result.status]++;
    const candidate = result.value ?? [];
    const ranges = result.status === "partial" ? result.uncertainRanges : [];
    let expectedIndex = 0,
      predictedIndex = 0,
      uncertainIndex = 0;
    for (let offset = 0; offset < row.input.length;) {
      const character = String.fromCodePoint(row.input.codePointAt(offset)!);
      if (character.trim()) {
        characters++;
        while (row.output[expectedIndex] && row.output[expectedIndex]!.end <= offset) {
          expectedIndex++;
        }
        while (candidate[predictedIndex] && candidate[predictedIndex]!.end <= offset) {
          predictedIndex++;
        }
        while (ranges[uncertainIndex] && ranges[uncertainIndex]!.end <= offset) {
          uncertainIndex++;
        }
        const expected = row.output[expectedIndex];
        const predicted = candidate[predictedIndex];
        const uncertain = ranges[uncertainIndex];
        const hasPrediction = predicted && predicted.start <= offset;
        const agrees =
          hasPrediction && expected && expected.start <= offset && predicted.type === expected.type;
        if (hasPrediction) {
          candidateCharacters++;
        }
        if (agrees) {
          correct++;
        }
        if (hasPrediction && (!uncertain || uncertain.start > offset)) {
          covered++;
          if (agrees) {
            coveredCorrect++;
          }
        }
      }
      offset += character.length;
    }
  }
  timings.sort((a, b) => a - b);
  return {
    runtime: "Burn WASM CPU",
    userAgent: navigator.userAgent,
    coldFirstParseMs,
    samples: timings.length,
    p50Ms: timings[Math.floor((timings.length - 1) * 0.5)],
    p95Ms: timings[Math.floor((timings.length - 1) * 0.95)],
    statuses,
    scoredCodePoints: characters,
    candidateCodePoints: candidateCharacters,
    candidateAgreement: candidateCharacters ? correct / candidateCharacters : null,
    confidentCoverage: covered / characters,
    confidentAgreement: covered ? coveredCorrect / covered : null,
  };
}
