import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
export interface RecurrentConfig {
  featureCount: number;
  labelCount: number;
  maxParts: number;
}
export interface RecurrentData {
  features: Int32Array;
  targets: Float32Array;
  offsets: Uint32Array;
}
export interface RecurrentOptions {
  epochs: number;
  learningRate: number;
  batchParts: number;
}
interface Result {
  weights: Uint8Array;
  parameters: number;
  loss: number[];
  validationAccuracy: number[];
  selectedEpoch: number;
}
interface Predictor {
  predict(features: Int32Array): number[];
}
interface Native {
  fitRecurrent(
    config: string,
    options: string,
    train: RecurrentData,
    validation: RecurrentData,
    progress: (error: Error | null, value: number[]) => void,
  ): Promise<Result>;
  RecurrentPredictor: new (config: string, weights: Buffer) => Predictor;
}
export function fitRecurrent(
  config: RecurrentConfig,
  options: RecurrentOptions,
  train: RecurrentData,
  validation: RecurrentData,
  progress?: (epoch: number, loss: number) => void,
) {
  const native = require("#native") as Native;
  return native.fitRecurrent(
    JSON.stringify(config),
    JSON.stringify(options),
    train,
    validation,
    (error, value) => {
      if (!error) {
        progress?.(value[0]!, value[1]!);
      }
    },
  );
}
export function recurrentPredictor(config: RecurrentConfig, weights: Uint8Array): Predictor {
  const native = require("#native") as Native;
  return new native.RecurrentPredictor(JSON.stringify(config), Buffer.from(weights));
}
