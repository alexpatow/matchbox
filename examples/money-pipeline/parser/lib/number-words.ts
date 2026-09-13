const small: Record<string, number> = Object.fromEntries(
  "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen"
    .split(" ")
    .map((word, index) => [word, index]),
);
const tens: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};
export function normalizeNumber(text: string): number | null {
  if (/^\d+(?:\.\d{1,2})?$/.test(text) || /^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(text))
    return Number(text.replaceAll(",", ""));
  const words = text.toLowerCase().split(/\s+/);
  if (words.length === 1) return small[words[0]!] ?? tens[words[0]!] ?? null;
  if (words.length === 2 && tens[words[0]!] && small[words[1]!] && small[words[1]!]! < 10)
    return tens[words[0]!]! + small[words[1]!]!;
  return null;
}
