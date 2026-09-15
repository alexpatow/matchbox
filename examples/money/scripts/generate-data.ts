import { language } from "./language";
import { augment } from "./augment";
import { mkdir, writeFile } from "node:fs/promises";
import { tokenize } from "@matchbox-ai/train";
type Part = [text: string, label: string];
const rows: {
  input: string;
  output: { amount: number; currency: string; approximate: boolean };
}[] = [];
const spans: Record<string, string[]> = {};
function add(parts: Part[], amount: number, currency: string, approximate = false) {
  const input = parts.map(([text]) => text).join("");
  const labels = parts.flatMap(([text, label]) => tokenize(text, "words").map(() => label));
  if (labels.length !== tokenize(input, "words").length) {
    throw new Error(`Boundary mismatch: ${input}`);
  }
  if (spans[input]) {
    return;
  }
  rows.push({ input, output: { amount, currency, approximate } });
  spans[input] = labels;
}
const currencies = [
  ["EUR", "€", "euros"],
  ["USD", "USD", "dollars"],
  ["USD", "$", "dollars"],
  ["GBP", "£", "pounds"],
  ["SEK", "SEK", "kronor"],
] as const;
const amounts = [
  ["12.50", 12.5],
  ["7", 7],
  ["35", 35],
  ["250", 250],
  ["1,200", 1200],
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
  ["thirty", 30],
  ["forty", 40],
  ["fifty", 50],
  ["sixty", 60],
  ["seventy", 70],
  ["eighty", 80],
  ["ninety", 90],
  ["twenty one", 21],
  ["thirty two", 32],
  ["forty three", 43],
  ["fifty four", 54],
  ["sixty five", 65],
  ["seventy six", 76],
  ["eighty seven", 87],
  ["ninety nine", 99],
] as const;
for (const [code, symbol, name] of currencies) {
  for (const [text, amount] of amounts) {
    const a: Part = [text, "AMOUNT"];
    add([[symbol + " ", code], a], amount, code);
    add([a, [" " + name, code]], amount, code);
    add([["send ", "O"], a, [" " + name, code], [" to Maja", "O"]], amount, code);
    add([["Oskar paid ", "O"], a, [" " + name, code], [" yesterday", "O"]], amount, code);
    add([["about ", "APPROX"], a, [" " + name, code]], amount, code, true);
    add([["we paid ", "O"], [code + " ", code], a], amount, code);
    add([["in 2024 we paid ", "O"], [code + " ", code], a], amount, code);
    add([["we paid ", "O"], a, [" " + code, code]], amount, code);
    add([["invoice 2048 totals ", "O"], [symbol + " ", code], a], amount, code);
    add([["in 2024 we paid ", "O"], a, [" " + name, code]], amount, code);
    add([a, [" " + name, code], [" for order 1234", "O"]], amount, code);
    add(
      [["the budget is ", "O"], a, [" thousand ", "THOUSAND"], [name, code]],
      amount * 1000,
      code,
    );
    add(
      [["around ", "APPROX"], a, [" grand ", "THOUSAND"], ["in ", "O"], [name, code]],
      amount * 1000,
      code,
      true,
    );
    add(
      [["roughly ", "APPROX"], [code + " ", code], a, [" million", "MILLION"]],
      amount * 1_000_000,
      code,
      true,
    );
    add([["a price of ", "O"], ["roughly ", "APPROX"], a, [" " + name, code]], amount, code, true);
    add(
      [["the budget is ", "O"], a, [" million ", "MILLION"], [name, code]],
      amount * 1_000_000,
      code,
    );
    add([["a price of ", "O"], a, [" " + name, code]], amount, code);
  }
  for (const [word, scale] of [
    ["k", 1000],
    ["m", 1_000_000],
  ] as const) {
    for (const n of [5, 10, 15, 20, 30, 40, 50]) {
      add(
        [
          [String(n), "AMOUNT"],
          [word, scale === 1000 ? "THOUSAND" : "MILLION"],
          [" " + code, code],
        ],
        n * scale,
        code,
      );
    }
  }
}
const rejections = [...language(rows, spans), ...augment(rows, spans)];
const root = new URL("../matchbox/money/data/", import.meta.url);
await mkdir(root, { recursive: true });
await writeFile(
  new URL("train.jsonl", root),
  rows.map((row) => JSON.stringify(row)).join("\n") + "\n",
);
await writeFile(new URL("train-spans.json", root), JSON.stringify(spans, null, 2) + "\n");
console.log(`Generated ${rows.length} money examples with exact token annotations.`);

await writeFile(new URL("train-rejections.json", root), JSON.stringify(rejections, null, 2) + "\n");
