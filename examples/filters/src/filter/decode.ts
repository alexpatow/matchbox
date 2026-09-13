import { compileClauses, type SequenceDecoder } from "@matchbox-ai/core/runtime";
import { decodeClause } from "./decode-clause.js";
const decode: SequenceDecoder = (tokens, input) => {
  let cursor = 0;
  const result = compileClauses(input, (clause) => {
    const start = input.indexOf(clause, cursor);
    cursor = start + clause.length;
    const selected = tokens.filter((token) => token.start >= start && token.end <= cursor);
    return { value: decodeClause(selected), confidence: 1 };
  });
  return result.value;
};
export default decode;
