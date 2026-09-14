import type { MatchboxParser } from "@matchbox-ai/core/runtime";
import task from "../parser";
import { quantity } from "../lib";
// Deliberately small rule baseline for canonical single-unit and clock expressions.
const units: Record<string, number> = { second: 1, minute: 60, hour: 3600, day: 86400 };
const baseline: MatchboxParser<unknown> = {
  async parse(input) {
    const duration =
      /^(?:(for|in) )?(\d+(?:\.\d+)?|one|two|three) (seconds?|minutes?|hours?|days?)$/i.exec(input);
    const clock = /^(today|tomorrow) at (\d{1,2})(?::(\d{2}))?(?: (am|pm))?$/i.exec(input);
    let value: unknown = null;
    if (duration) {
      const amount = quantity(duration[2]!);
      if (amount !== null)
        value = {
          kind: duration[1]?.toLowerCase() === "in" ? "relative" : "duration",
          seconds: amount * units[duration[3]!.toLowerCase().replace(/s$/, "")]!,
        };
    } else if (clock) {
      const hour = Number(clock[2]);
      const period = clock[4]?.toLowerCase();
      if (!period || (hour >= 1 && hour <= 12))
        value = {
          kind: "datetime",
          dayOffset: clock[1]!.toLowerCase() === "today" ? 0 : 1,
          hour: period ? (hour % 12) + (period === "pm" ? 12 : 0) : hour,
          minute: Number(clock[3] ?? 0),
        };
    }
    const result = task.validateOutput(value);
    return result.success
      ? { status: "ok", value: result.data, confidence: 1 }
      : { status: "uncertain", value: null, confidence: 0, reason: "No baseline rule matched." };
  },
};
export default baseline;
