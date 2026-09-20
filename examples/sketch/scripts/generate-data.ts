import { writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { randomSource, stroke, type Kind } from "./strokes";
const root = resolve(import.meta.dir, "../matchbox/shapes");
const kinds: Kind[] = ["ellipse", "rectangle", "triangle", "line", "unknown"];
async function write(split: string, seed: number, count: number, preserve: boolean) {
  const path = resolve(root, split);
  if (
    preserve &&
    (await access(path).then(
      () => true,
      () => false,
    ))
  ) {
    return;
  }
  const random = randomSource(seed);
  const rows = Array.from({ length: count }, (_, i) => {
    const kind = kinds[i % kinds.length]!;
    return { input: { points: stroke(kind, random) }, output: { kind } };
  });
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rows[i], rows[j]] = [rows[j]!, rows[i]!];
  }
  await writeFile(path, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
}
await write("data/train.jsonl", 42, 3000, false);
await write("evals/validation.jsonl", 2049, 400, true);
await write("evals/test.jsonl", 8193, 400, true);
