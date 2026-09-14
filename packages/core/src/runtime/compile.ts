import type { FilterExpression, Predicate } from "./types.js";
export function compileClauses(
  input: string,
  recognize: (clause: string) => { value: Predicate | null; confidence: number },
): { value: FilterExpression | null; confidence: number } {
  // The proof supports explicit AND/OR with AND binding more tightly. No parentheses or implicit joins.
  if (!input.trim() || input.length > 500 || /[();\n]/.test(input)) {
    return { value: null, confidence: 0 };
  }
  const parts = input.trim().split(/\s+(and|or)(?!\s+equal\s+to\b)\s+/i);
  if (parts.length > 15) {
    return { value: null, confidence: 0 };
  }
  const groups: Predicate[][] = [[]];
  let confidence = 1;
  for (let i = 0; i < parts.length; i += 2) {
    const result = recognize(parts[i]!);
    confidence = Math.min(confidence, result.confidence);
    if (!result.value) {
      return { value: null, confidence };
    }
    if (i > 0 && parts[i - 1]!.toLowerCase() === "or") {
      groups.push([]);
    }
    groups.at(-1)!.push(result.value);
  }
  const nodes = groups.map((and) => (and.length === 1 ? and[0]! : { and }));
  return { value: nodes.length === 1 ? nodes[0]! : { or: nodes }, confidence };
}
