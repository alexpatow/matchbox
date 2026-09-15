import { tokenize } from "@matchbox-ai/train";
type Row = { input: string; output: unknown };
// Prefixes are neutral in these explicitly authored examples, not runtime normalization rules.
export function language(rows: Row[], spans: Record<string, string[]>) {
  const rejections: { input: string; output: null }[] = [];
  for (const [i, row] of [...rows].entries()) {
    if (i % 23 !== 0) {
      continue;
    }
    for (const prefix of [
      "please note ",
      "start ",
      "we will meet ",
      "please start ",
      "your appointment is ",
      "our timer is set ",
      "the reminder is ",
      "can you notify us ",
      "please notify me ",
      "the meeting is ",
    ]) {
      const input = prefix + row.input;
      if (!spans[input]) {
        spans[input] = [...tokenize(prefix, "words").map(() => "O"), ...spans[row.input]!];
        rows.push({ input, output: row.output });
      }
    }
  }
  for (const [word, amount] of [
    ["three", 3],
    ["seven", 7],
    ["eleven", 11],
    ["sixteen", 16],
    ["19", 19],
  ] as const) {
    for (const seconds of [1, 5, 15, 30]) {
      for (const [prefix, labels, kind] of [
        ["for ", ["DURATION"], "duration"],
        ["set a timer for ", ["O", "O", "O", "DURATION"], "duration"],
        ["in ", ["RELATIVE"], "relative"],
      ] as const) {
        const input = `${prefix}${word} minutes and ${seconds} seconds`;
        spans[input] = [...labels, "AMOUNT", "MINUTE", "O", "AMOUNT", "SECOND"];
        rows.push({ input, output: { kind, seconds: amount * 60 + seconds } });
      }
    }
  }
  for (const [day, days] of [
    ["one", 1],
    ["three", 3],
    ["five", 5],
  ] as const) {
    for (const [hour, hours] of [
      ["two", 2],
      ["six", 6],
      ["nine", 9],
    ] as const) {
      for (const [prefix, label, kind] of [
        ["in", "RELATIVE", "relative"],
        ["for", "DURATION", "duration"],
      ] as const) {
        const input = prefix + " " + day + " days and " + hour + " hours";
        spans[input] = [label, "AMOUNT", "DAY", "O", "AMOUNT", "HOUR"];
        rows.push({ input, output: { kind, seconds: days * 86400 + hours * 3600 } });
      }
    }
  }
  for (const unit of ["seconds", "minutes", "hours"]) {
    for (const amount of [5, 15, 30]) {
      const input = `in minus ${amount} ${unit}`;
      const label = { seconds: "SECOND", minutes: "MINUTE", hours: "HOUR" }[unit]!;
      spans[input] = ["RELATIVE", "REJECT", "AMOUNT", label];
      rejections.push({ input, output: null });
    }
  }
  return rejections;
}
