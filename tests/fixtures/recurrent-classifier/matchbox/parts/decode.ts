import type { SequenceDecoder } from "@matchbox-ai/core/runtime";
export default ((tokens) =>
  tokens.map(({ label, start, end }) => ({
    type: label,
    start,
    end,
  }))) satisfies SequenceDecoder;
