export interface TrainingConfig {
  challenges?: string;
  features?: { encoder: string; threshold: number };
  sequence?: {
    recipe: string;
    decoder: string;
    contextRadius?: number;
    recurrent?: {
      epochs: number;
      learningRate: number;
      batchParts: number;
      maxInputLength: number;
      maxParts: number;
    };
  };
  task?: string;
  train?: string;
  validation?: string;
  eval?: string;
  output?: string;
  minAccuracy?: number;
  maxBytes?: number;
}
