import type { SequenceDecoder } from "@matchbox-ai/core/runtime";
import { decodeClock, quantity } from "./index";
const scales: Record<string, number> = { SECOND: 1, MINUTE: 60, HOUR: 3600, DAY: 86400 };
const decode: SequenceDecoder = (tokens) => {
  if (tokens.some((t) => t.label === "TODAY" || t.label === "TOMORROW")) return decodeClock(tokens);
  const modes = tokens.filter((t) => t.label === "DURATION" || t.label === "RELATIVE");
  if (modes.length > 1) return null;
  let seconds = 0;
  let pairs = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (["O", "DURATION", "RELATIVE"].includes(token.label)) continue;
    if (token.label !== "AMOUNT") return null;
    const value = quantity(token.text);
    const scale = scales[tokens[++i]?.label ?? ""];
    if (value === null || !scale) return null;
    seconds += value * scale;
    pairs++;
  }
  if (!pairs || !Number.isFinite(seconds) || seconds > 604800) return null;
  return { kind: modes[0]?.label === "RELATIVE" ? "relative" : "duration", seconds };
};
export default decode;
