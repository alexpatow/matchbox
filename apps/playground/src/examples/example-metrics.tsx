import { useEffect, useState } from "react";
import { measure, milliseconds, type TimingResult } from "@/benchmark";
import type { ExampleLoader } from "./types";
export function ExampleMetrics({
  load,
  sample,
  name,
}: {
  load: ExampleLoader;
  sample: string;
  name: string;
}) {
  const [bytes, setBytes] = useState<number | null>(null);
  const [timing, setTiming] = useState<TimingResult | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let current = true;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    load()
      .then(({ default: parser, report }) => {
        if (!current) {
          return;
        }
        setBytes(report.bytes);
        timer = setTimeout(() => {
          measure(parser, [sample], controller.signal).then(
            (result) => {
              if (current) {
                setTiming(result);
              }
            },
            () => {
              if (current) {
                setFailed(true);
              }
            },
          );
        }, 0);
      })
      .catch(() => {
        if (current) {
          setFailed(true);
        }
      });
    return () => {
      current = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [load, sample]);
  return (
    <footer className="example-metrics">
      {bytes !== null && (
        <span title="Model artifact only; runtime is additional.">
          {(bytes / 1024).toFixed(1)} KiB model
        </span>
      )}
      {timing && (
        <output
          title="300 warm parses of the first example, excluding model loading."
          data-testid={`${name}-timing`}
          data-report={JSON.stringify(timing)}
        >
          {milliseconds(timing.p50Ms)} ms median · {milliseconds(timing.p95Ms)} ms p95
        </output>
      )}
      {failed && <span>Timing unavailable.</span>}
      <a href={`https://github.com/alexpatow/matchbox/tree/main/examples/${name}`}>Source</a>
    </footer>
  );
}
