import { compileClauses, type SequenceDecoder } from "@matchbox-ai/core/runtime";
import { decodeClause } from "./decode-clause.js";
const decode: SequenceDecoder = (tokens, input) => {
  // Protect boolean words inside country names, such as Trinidad and Tobago.
  const masked = input.split("");
  for (const token of tokens)
    if (token.label === "COUNTRY")
      for (let index = token.start; index < token.end; index++) masked[index] = "_";
  const text = masked.join("");
  let cursor = 0;
  const result = compileClauses(text, (clause) => {
    const start = text.indexOf(clause, cursor);
    cursor = start + clause.length;
    const selected = tokens.filter((token) => token.start >= start && token.end <= cursor);
    return { value: decodeClause(selected), confidence: 1 };
  });
  return result.value;
};
export default decode;
