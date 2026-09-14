export interface TimingResult {
  inputs?: string[];
  samples: number;
  accepted: number;
  p50Ms: number;
  p95Ms: number;
}
export function milliseconds(value: number) {
  return value < 0.01 ? "<0.01" : value.toFixed(2);
}
