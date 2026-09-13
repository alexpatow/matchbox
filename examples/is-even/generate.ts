import { mkdir, writeFile } from "node:fs/promises";
const root = new URL("./data/", import.meta.url);
await mkdir(root, { recursive: true });
const rows = Array.from({ length: 400 }, (_, index) => {
  const input = String(index);
  return { input, output: { even: BigInt(input) % 2n === 0n } };
});
await writeFile(
  new URL("train.jsonl", root),
  rows.map((row) => JSON.stringify(row)).join("\n") + "\n",
);
