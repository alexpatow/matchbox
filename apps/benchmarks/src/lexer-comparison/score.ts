export const labels = [
  "plain",
  "comment",
  "string",
  "number",
  "keyword",
  "type",
  "function",
  "constant",
  "operator",
] as const;
export interface Span {
  type: string;
  start: number;
  end: number;
}
export interface Example {
  input: string;
  output: Span[];
  language: string;
}
export function score(row: Example, spans: Span[] | null) {
  const confusion = labels.map(() => Array<number>(labels.length + 1).fill(0));
  let expected = 0,
    predicted = 0,
    characters = 0,
    correct = 0,
    covered = 0;
  let offset = 0;
  for (const character of row.input) {
    while (row.output[expected] && row.output[expected]!.end <= offset) {
      expected++;
    }
    while (spans?.[predicted] && spans[predicted]!.end <= offset) {
      predicted++;
    }
    if (character.trim()) {
      const truth = row.output[expected];
      const actual = spans?.[predicted];
      const target = labels.indexOf(truth?.type as (typeof labels)[number]);
      const value =
        actual && actual.start <= offset
          ? labels.indexOf(actual.type as (typeof labels)[number])
          : -1;
      if (!truth || truth.start > offset || target < 0) {
        throw new Error("Incomplete or unknown teacher label");
      }
      const prediction = value < 0 ? labels.length : value;
      confusion[target]![prediction]!++;
      characters++;
      if (value >= 0) {
        covered++;
      }
      if (value === target) {
        correct++;
      }
    }
    offset += character.length;
  }
  return {
    language: row.language,
    characters,
    correct,
    covered,
    exactSpans:
      spans?.length === row.output.length &&
      spans.every((span, index) => {
        const expected = row.output[index]!;
        return (
          span.type === expected.type && span.start === expected.start && span.end === expected.end
        );
      }),
    exactLabels: correct === characters,
    confusion,
  };
}
export type DocumentScore = ReturnType<typeof score>;
export function summarize(documents: DocumentScore[]) {
  const confusion = labels.map(() => Array<number>(labels.length + 1).fill(0));
  for (const doc of documents) {
    doc.confusion.forEach((row, i) =>
      row.forEach((count, j) => {
        confusion[i]![j]! += count;
      }),
    );
  }
  const characters = documents.reduce((sum, doc) => sum + doc.characters, 0);
  const correct = documents.reduce((sum, doc) => sum + doc.correct, 0);
  const covered = documents.reduce((sum, doc) => sum + doc.covered, 0);
  const classes = labels.map((label, i) => {
    const support = confusion[i]!.reduce((sum, n) => sum + n, 0);
    const predictions = confusion.reduce((sum, row) => sum + row[i]!, 0);
    return {
      label,
      support,
      f1: support + predictions ? (2 * confusion[i]![i]!) / (support + predictions) : null,
    };
  });
  const styled = classes.filter((row) => row.label !== "plain" && row.support);
  return {
    documents: documents.length,
    characters,
    agreement: correct / characters,
    coverage: covered / characters,
    exactSpans: documents.filter((row) => row.exactSpans).length / documents.length,
    exactLabels: documents.filter((row) => row.exactLabels).length / documents.length,
    styledMacroF1: styled.reduce((sum, row) => sum + row.f1!, 0) / styled.length,
    classes,
    confusion,
  };
}
