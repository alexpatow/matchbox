import { augment } from "./augment";
import { mkdir, writeFile } from "node:fs/promises";
import { tokenize } from "@matchbox-ai/train";
type Part = [string, string];
const rows: { input: string; output: unknown }[] = [];
const spans: Record<string, string[]> = {};
function add(parts: Part[], output: unknown) {
  const input = parts.map(([text]) => text).join("");
  const labels = parts.flatMap(([text, label]) => tokenize(text, "words").map(() => label));
  if (labels.length !== tokenize(input, "words").length) {
    throw new Error(`Token alignment: ${input}`);
  }
  if (spans[input]) {
    return;
  }
  spans[input] = labels;
  rows.push({ input, output });
}
const amounts = [
  ["1", 1],
  ["5", 5],
  ["15", 15],
  ["30", 30],
  ["60", 60],
  ["1.5", 1.5],
  ["a", 1],
  ["an", 1],
  ["one", 1],
  ["two", 2],
  ["three", 3],
  ["four", 4],
  ["five", 5],
  ["six", 6],
  ["seven", 7],
  ["eight", 8],
  ["nine", 9],
  ["ten", 10],
  ["eleven", 11],
  ["twelve", 12],
  ["thirteen", 13],
  ["fourteen", 14],
  ["fifteen", 15],
  ["sixteen", 16],
  ["seventeen", 17],
  ["eighteen", 18],
  ["nineteen", 19],
  ["twenty", 20],
  ["half", 0.5],
] as const;
const units = [
  ["second", "SECOND", 1],
  ["seconds", "SECOND", 1],
  ["minute", "MINUTE", 60],
  ["minutes", "MINUTE", 60],
  ["hour", "HOUR", 3600],
  ["hours", "HOUR", 3600],
  ["day", "DAY", 86400],
  ["days", "DAY", 86400],
] as const;
for (const [text, value] of amounts) {
  for (const [unit, label, scale] of units) {
    if (value * scale > 604800) {
      continue;
    }
    for (const [prefix, cue, kind] of [
      ["", "O", "duration"],
      ["for ", "DURATION", "duration"],
      ["in ", "RELATIVE", "relative"],
      ["wait for ", "DURATION", "duration"],
      ["remind me in ", "RELATIVE", "relative"],
      ["set a timer for ", "DURATION", "duration"],
      ["a reminder in ", "RELATIVE", "relative"],
    ] as const) {
      const words = prefix.trim().split(" ").filter(Boolean);
      const parts: Part[] = words.map((word, i) => [
        word + " ",
        i === words.length - 1 ? cue : "O",
      ]);
      add([...parts, [text, "AMOUNT"], [" " + unit, label]], { kind, seconds: value * scale });
    }
  }
}
for (const [h, hour] of amounts.slice(0, 15)) {
  for (const [m, minute] of amounts.slice(0, 10)) {
    if (hour > 12 || minute > 60) {
      continue;
    }
    for (const [prefix, cue, kind] of [
      ["for ", "DURATION", "duration"],
      ["in ", "RELATIVE", "relative"],
    ] as const) {
      add(
        [
          [prefix, cue],
          [h, "AMOUNT"],
          [" hours ", "HOUR"],
          ["and ", "O"],
          [m, "AMOUNT"],
          [" minutes", "MINUTE"],
        ],
        { kind, seconds: hour * 3600 + minute * 60 },
      );
    }
  }
}
for (const [day, label, dayOffset] of [
  ["today", "TODAY", 0],
  ["tomorrow", "TOMORROW", 1],
] as const) {
  for (const hour of [1, 2, 3, 4, 6, 8, 9, 10, 11, 12]) {
    for (const period of ["am", "pm"]) {
      for (const minute of [null, "00", "15", "30", "45"]) {
        const clock: Part[] = [[String(hour), "CLOCK"]];
        if (minute !== null) {
          clock.push([":", "COLON"], [minute, "CLOCK"]);
        }
        for (const prefix of ["", "schedule ", "remind me "]) {
          add(
            [
              [prefix, "O"],
              [day, label],
              [" at ", "O"],
              ...clock,
              [" " + period, period.toUpperCase()],
            ],
            {
              kind: "datetime",
              dayOffset,
              hour: (hour % 12) + (period === "pm" ? 12 : 0),
              minute: Number(minute),
            },
          );
        }
      }
    }
  }
  for (const hour of [0, 7, 13, 16, 18, 21, 23]) {
    for (const minute of ["00", "15", "30"]) {
      add(
        [
          [day, label],
          [" at ", "O"],
          [String(hour), "CLOCK"],
          [":", "COLON"],
          [minute, "CLOCK"],
        ],
        { kind: "datetime", dayOffset, hour, minute: Number(minute) },
      );
    }
  }
}
const rejections = augment(rows, spans);
const root = new URL("../matchbox/time/data/", import.meta.url);
await mkdir(root, { recursive: true });
await writeFile(
  new URL("train.jsonl", root),
  rows.map((row) => JSON.stringify(row)).join("\n") + "\n",
);
await writeFile(new URL("train-spans.json", root), JSON.stringify(spans, null, 2) + "\n");
console.log(`Generated ${rows.length} time examples. Independent evals were not changed.`);

await writeFile(new URL("train-rejections.json", root), JSON.stringify(rejections, null, 2) + "\n");
