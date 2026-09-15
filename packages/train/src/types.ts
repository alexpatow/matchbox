export interface TrainingConfig {
  challenges?: string;
  sequence?: { recipe: string; decoder: string };
  task?: string;
  train?: string;
  validation?: string;
  eval?: string;
  output?: string;
  minAccuracy?: number;
  maxBytes?: number;
}
