export interface Metrics {
  examples: number;
  exactAccuracy: number;
  abstentionRate: number;
  invalidOutputRate: number;
  failures: { input: unknown; expected: unknown; actual: unknown }[];
}
export interface Operation {
  command: string;
  ok: boolean;
  result: Partial<Metrics> & { evaluation?: Metrics; bytes?: number; next?: string };
}
