import { mkdir, writeFile } from "node:fs/promises";
const root = new URL("./data/", import.meta.url);
await mkdir(root, { recursive: true });
for (const [name, start, count] of [
  ["train", 0, 400],
  ["validation", 1000, 100],
  ["evals", 10000, 100],
] as const) {
  const rows = Array.from({ length: count }, (_, index) => {
    const input =
      name === "evals" && index >= 50
        ? `123456789012345678901234567890${index}`
        : String(start + index);
    return { input, output: { even: BigInt(input) % 2n === 0n } };
  });
  await writeFile(
    new URL(`${name}.jsonl`, root),
    rows.map((row) => JSON.stringify(row)).join("\n") + "\n",
  );
}
