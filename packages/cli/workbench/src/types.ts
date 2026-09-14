export interface Metrics {
  examples: number;
  exactAccuracy: number;
  abstentionRate: number;
  invalidOutputRate: number;
  failures: { input: string; expected: unknown; actual: unknown }[];
}
export interface Operation {
  command: string;
  ok: boolean;
  result: Partial<Metrics> & { quantized?: Metrics; bytes?: number; next?: string };
}
