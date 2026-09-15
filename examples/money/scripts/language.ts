import { tokenize } from "@matchbox-ai/train";
type Row = { input: string; output: { amount: number; currency: string; approximate: boolean } };
// Authored training variations only. Evaluation files are never read or regenerated here.
export function language(rows: Row[], spans: Record<string, string[]>) {
  const rejections: { input: string; output: null }[] = [];
  const add = (input: string, labels: string[], output: Row["output"] | null) => {
    if (spans[input]) {
      return;
    }
    spans[input] = labels;
    if (output === null) {
      rejections.push({ input, output });
    } else {
      rows.push({ input, output });
    }
  };
  for (const [i, row] of [...rows].entries()) {
    if (i % 19 !== 0) {
      continue;
    }
    const labels = spans[row.input]!;
    for (const prefix of [
      "record this payment of ",
      "this expense totals ",
      "the payment comes to ",
      "record a refund of ",
      "we owe ",
      "please log ",
      "the balance is ",
      "can you record ",
    ]) {
      add(prefix + row.input, [...tokenize(prefix, "words").map(() => "O"), ...labels], row.output);
    }
    for (const prefix of [
      "minus ",
      "at least ",
      "at most ",
      "above ",
      "below ",
      "between ",
      "either ",
      "from ",
    ]) {
      const cue = tokenize(prefix, "words").map(() => "REJECT");
      add(prefix + row.input, [...cue, ...labels], null);
      add("approximately " + prefix + row.input, ["APPROX", ...cue, ...labels], null);
    }
    const prefix = "nearly ";
    add(prefix + row.input, ["APPROX", ...labels], { ...row.output, approximate: true });
  }
  for (const [currency, word] of [
    ["EUR", "euros"],
    ["USD", "dollars"],
    ["GBP", "pounds"],
    ["SEK", "kronor"],
  ]) {
    for (const [first, second] of [
      [7, 35],
      [12, 250],
      [35, 1200],
    ]) {
      for (const [prefix, labels] of [
        ["between", ["REJECT"]],
        ["roughly between", ["APPROX", "REJECT"]],
      ] as const) {
        add(
          `${prefix} ${first} and ${second} ${word}`,
          [...labels, "AMOUNT", "O", "AMOUNT", currency!],
          null,
        );
      }
      add(
        `from ${first} to ${second} ${word}`,
        ["REJECT", "AMOUNT", "O", "AMOUNT", currency!],
        null,
      );
    }
  }
  for (const [text, amount] of [
    ["three", 3],
    ["seven", 7],
    ["eleven", 11],
    ["fifteen", 15],
    ["twenty", 20],
    ["35", 35],
  ] as const) {
    for (const [currency, word] of [
      ["EUR", "euros"],
      ["USD", "dollars"],
      ["GBP", "pounds"],
      ["SEK", "kronor"],
    ] as const) {
      for (const [scaleWord, scale, label] of [
        ["grand", 1000, "THOUSAND"],
        ["thousand", 1000, "THOUSAND"],
        ["million", 1000000, "MILLION"],
      ] as const) {
        for (const cue of ["about", "around", "nearly"]) {
          add(
            cue + " " + text + " " + scaleWord + " " + word,
            ["APPROX", "AMOUNT", label, currency],
            { amount: amount * scale, currency, approximate: true },
          );
        }
      }
    }
    for (const phrase of [
      "bonus credits",
      "reward points",
      "spare chairs",
      "extra tickets",
      "wooden tokens",
      "plastic coins",
    ]) {
      add(text + " " + phrase, ["AMOUNT", "O", "REJECT"], null);
    }
  }
  return rejections;
}
