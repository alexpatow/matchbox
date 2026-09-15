import { createParser } from "@matchbox-ai/core/runtime";
import decode from "../../../examples/money/matchbox/money/decode/decode";
import task from "../../../examples/money/matchbox/money/parser";
import raw from "../../../examples/money/.matchbox/money/model.matchbox?raw";
import evaluation from "../../../examples/money/matchbox/money/evals/test.jsonl?raw";

async function benchmark() {
  const rows = evaluation
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as { input: string; output: unknown });
  const start = performance.now();
  const parser = createParser(JSON.parse(raw), task, decode);
  const first = await parser.parse(rows[0]!.input);
  const coldFirstParseMs = performance.now() - start;
  try {
    const results = await Promise.all(rows.map((row) => parser.parse(row.input)));
    for (let i = 0; i < 20; i++) {
      await parser.parse(rows[i % rows.length]!.input);
    }
    const timings: number[] = [];
    for (let i = 0; i < 300; i++) {
      const tick = performance.now();
      await parser.parse(rows[i % rows.length]!.input);
      timings.push(performance.now() - tick);
    }
    timings.sort((a, b) => a - b);
    return {
      runtime: "burn-wasm-cpu",
      coldFirstParseMs,
      samples: timings.length,
      p50Ms: timings[149],
      p95Ms: timings[284],
      first,
      results,
    };
  } finally {
    if ("dispose" in parser && typeof parser.dispose === "function") {
      parser.dispose();
    }
  }
}

declare global {
  interface Window {
    benchmarkRuntime: typeof benchmark;
  }
}
window.benchmarkRuntime = benchmark;
document.querySelector("#run")!.addEventListener("click", async () => {
  const output = document.querySelector("#result")!;
  output.textContent = "Measuring…";
  try {
    output.textContent = JSON.stringify(await benchmark(), null, 2);
  } catch (error) {
    output.textContent = String(error);
  }
});
