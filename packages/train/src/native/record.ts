import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
type Config = { vocabularySize: number; fields: number[] };
interface Native {
  fitRecord(
    config: string,
    inputs: Float32Array,
    labels: Int32Array,
    progress: (error: Error | null, values: number[]) => void,
  ): Promise<{ weights: Uint8Array; untrained: Uint8Array; loss: number[] }>;
  predictRecord(config: string, weights: Buffer, inputs: Float32Array): number[];
}
export function fitNativeRecord(
  config: Config,
  inputs: number[][],
  labels: number[],
  progress?: (epoch: number, loss: number) => void,
) {
  const native = require("#native") as Native;
  return native.fitRecord(
    JSON.stringify(config),
    Float32Array.from(inputs.flat()),
    Int32Array.from(labels),
    (error, values) => {
      if (!error) {
        progress?.(values[0]!, values[1]!);
      }
    },
  );
}
export function predictNativeRecord(config: Config, weights: Uint8Array, inputs: number[]) {
  return (require("#native") as Native).predictRecord(
    JSON.stringify(config),
    Buffer.from(weights),
    Float32Array.from(inputs),
  );
}
