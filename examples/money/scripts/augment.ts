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
        if (spans[input]) continue;
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
        if (spans[input]) continue;
        spans[input] = ["REJECT", ...labels];
        rejections.push({ input, output: null });
      }
    }
  }
  for (const text of ["three hundred euros", "five hundred dollars", "seven hundred pounds"]) {
    const input = text;
    const currency = text.endsWith("euros") ? "EUR" : text.endsWith("dollars") ? "USD" : "GBP";
    spans[input] = ["AMOUNT", "REJECT", currency];
    rejections.push({ input, output: null });
  }
  return rejections;
}
