export interface TrainingConfig {
  formatVersion: 1;
  baseline: string;
  task: string;
  train: string;
  validation: string;
  eval: string;
  output: string;
  minAccuracy: number;
  maxBytes: number;
}
