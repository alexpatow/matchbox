export function numbers(text: string): number[] {
  return [...text.matchAll(/-?\d[\d,]*(?:\.\d+)?\s*[km]?\b/gi)].map(([raw]) => {
    const cleaned = raw.replaceAll(",", "").replaceAll(" ", "").toLowerCase();
    if (!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?[km]?$/.test(raw.replace(/\s/g, "").toLowerCase()))
      return NaN;
    return (
      Number.parseFloat(cleaned) * (cleaned.endsWith("k") ? 1e3 : cleaned.endsWith("m") ? 1e6 : 1)
    );
  });
}
export function words(text: string): string[] {
  return (
    text
      .toLowerCase()
      .replace(/-?\d[\d,]*(?:\.\d+)?\s*[km]?\b/gi, " number ")
      .match(/[a-z]+|>=|<=|>|<|=/g) ?? []
  );
}
export function features(text: string): string[] {
  const tokens = words(text);
  const result = tokens.map((word) => `w:${word}`);
  for (let i = 0; i < tokens.length - 1; i++) result.push(`b:${tokens[i]} ${tokens[i + 1]}`);
  return [...new Set(result)].sort();
}
export function vector(text: string, vocabulary: readonly string[]): number[] {
  const present = new Set(features(text));
  const values: number[] = vocabulary.map((feature) => (present.has(feature) ? 1 : 0));
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value, 0)) || 1;
  return values.map((value) => value / norm);
}
