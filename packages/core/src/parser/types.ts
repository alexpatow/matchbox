import type { z } from "zod";

export interface FieldMetadata {
  readonly type?: string;
  readonly aliases?: readonly string[];
  readonly description?: string;
}

export interface ParserConfig<Output extends z.ZodType> {
  readonly input: z.ZodString;
  readonly output: Output;
  readonly fields?: Readonly<Record<string, FieldMetadata>>;
}

export interface ValidationIssue {
  readonly code: string;
  readonly path: readonly (string | number)[];
  readonly message: string;
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly issues: readonly ValidationIssue[] };

export interface ParserMetadata {
  readonly formatVersion: 1;
  readonly kind: "parser";
  readonly input: z.core.JSONSchema.BaseSchema;
  readonly output: z.core.JSONSchema.BaseSchema;
  readonly fields: Readonly<Record<string, FieldMetadata>>;
}

export interface ParserDefinition<Output extends z.ZodType> {
  readonly kind: "parser";
  readonly input: z.ZodString;
  readonly output: Output;
  validateInput(value: unknown): ValidationResult<string>;
  validateOutput(value: unknown): ValidationResult<z.output<Output>>;
  toJSON(): ParserMetadata;
}

export type InferOutput<Task extends ParserDefinition<z.ZodType>> = z.output<Task["output"]>;
