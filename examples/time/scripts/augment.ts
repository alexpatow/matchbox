import { tokenize } from "@matchbox-ai/train";
export function augment<T>(rows: { input: string; output: T }[], spans: Record<string, string[]>) {
  const rejections: { input: string; output: null }[] = [];
  const originals = [...rows];
  for (const [i, row] of originals.entries()) {
    const labels = spans[row.input]!;
    if (i % 5 === 0) {
      for (const [prefix, suffix] of [
        ["please ", ""],
        ["", " please"],
        ["", "?"],
        ["", "."],
      ]) {
        const input = prefix + row.input + suffix;
        if (spans[input]) {
          continue;
        }
        spans[input] = [
          ...tokenize(prefix!, "words").map(() => "O"),
          ...labels,
          ...tokenize(suffix!, "words").map(() => "O"),
        ];
        rows.push({ input, output: row.output });
      }
    }
    if (i % 7 === 0) {
      for (const cue of ["not", "never", "without", "under", "over"]) {
        const input = cue + " " + row.input;
        if (spans[input]) {
          continue;
        }
        spans[input] = ["REJECT", ...labels];
        rejections.push({ input, output: null });
      }
    }
  }
  for (const [i, row] of originals.entries()) {
    if (i % 9 !== 0) {
      continue;
    }
    for (const suffix of [" ago", " or three hours", " or 7 minutes"]) {
      const input = row.input + suffix;
      if (spans[input]) {
        continue;
      }
      spans[input] = [
        ...spans[row.input]!,
        ...tokenize(suffix, "words").map((_, i) => {
          if (i === 0) {
            return "REJECT";
          }
          if (i === 1) {
            return "AMOUNT";
          }
          return suffix.includes("hours") ? "HOUR" : "MINUTE";
        }),
      ];
      rejections.push({ input, output: null });
    }
  }
  for (const text of ["four months", "six weeks", "seven years"]) {
    const input = "for " + text;
    spans[input] = ["DURATION", "AMOUNT", "REJECT"];
    rejections.push({ input, output: null });
  }
  return rejections;
}
