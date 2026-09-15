import { createRequire } from "node:module";
interface NativeResult {
  parameters: number;
  weights: Uint8Array;
  loss: number[];
}
const require = createRequire(import.meta.url);
export function predict(
  config: { vocabularySize: number; labelCount: number },
  weights: Uint8Array,
  inputs: number[][],
): number[] {
  const native = require("#native") as {
    predict(config: string, weights: Buffer, inputs: Int32Array): number[];
  };
  return native.predict(
    JSON.stringify(config),
    Buffer.from(weights),
    Int32Array.from(inputs.flat()),
  );
}
export function fit(
  config: { vocabularySize: number; labelCount: number },
  inputs: number[][],
  labels: number[],
  progress?: (epoch: number, loss: number) => void,
): Promise<NativeResult> {
  const native = require("#native") as {
    fit(
      config: string,
      inputs: Int32Array,
      labels: Int32Array,
      progress: (error: Error | null, value: number[]) => void,
    ): Promise<NativeResult>;
  };
  return native.fit(
    JSON.stringify(config),
    Int32Array.from(inputs.flat()),
    Int32Array.from(labels),
    (error, value) => {
      if (!error) {
        progress?.(value[0]!, value[1]!);
      }
    },
  );
}
