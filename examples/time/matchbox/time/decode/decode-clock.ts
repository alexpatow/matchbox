import type { TaggedToken } from "@matchbox-ai/core/runtime";
import { quantity } from "./quantity";
export function decodeClock(tokens: readonly TaggedToken[]) {
  const days = tokens.filter((t) => t.label === "TODAY" || t.label === "TOMORROW");
  const clock = tokens.filter((t) => t.label === "CLOCK");
  const periods = tokens.filter((t) => t.label === "AM" || t.label === "PM");
  if (days.length !== 1 || !clock.length || clock.length > 2 || periods.length > 1) {
    return null;
  }
  if (
    tokens.some((t) => !["TODAY", "TOMORROW", "CLOCK", "COLON", "AM", "PM", "O"].includes(t.label))
  ) {
    return null;
  }
  const hour = quantity(clock[0]!.text);
  const minute = clock.length === 2 ? quantity(clock[1]!.text) : 0;
  if (
    hour === null ||
    minute === null ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    minute > 59
  ) {
    return null;
  }
  const first = tokens.indexOf(clock[0]!);
  if (
    clock.length === 2 &&
    (tokens[first + 1]?.label !== "COLON" || tokens[first + 2] !== clock[1])
  ) {
    return null;
  }
  if (tokens.filter((t) => t.label === "COLON").length !== clock.length - 1) {
    return null;
  }
  if (periods.length ? hour < 1 || hour > 12 : hour > 23) {
    return null;
  }
  return {
    kind: "datetime",
    dayOffset: days[0]!.label === "TODAY" ? 0 : 1,
    hour: periods.length ? (hour % 12) + (periods[0]!.label === "PM" ? 12 : 0) : hour,
    minute,
  };
}
