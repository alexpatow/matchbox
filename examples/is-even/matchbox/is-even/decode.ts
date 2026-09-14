import type { SequenceDecoder } from "@matchbox-ai/core/runtime";
const decode: SequenceDecoder = (tokens, input) => {
  if (!/^\d+$/.test(input)) return null;
  const label = tokens.at(-1)?.label;
  return label === "EVEN" || label === "ODD" ? { even: label === "EVEN" } : null;
};
export default decode;
