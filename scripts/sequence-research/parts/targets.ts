export interface LabeledSpan {
  start: number;
  end: number;
  type: string;
}

/** Preserve mixed-label parts and count Unicode code points, not UTF-16 units. */
export function partTargets(
  input: string,
  spans: LabeledSpan[],
  ranges: Uint32Array,
  labels: string[],
) {
  let span = 0;
  const targets: number[][] = [];
  for (let index = 0; index < ranges.length; index += 2) {
    const counts = labels.map(() => 0);
    const start = ranges[index]!;
    const end = ranges[index + 1]!;
    for (let offset = start; offset < end;) {
      const character = String.fromCodePoint(input.codePointAt(offset)!);
      while (span < spans.length && spans[span]!.end <= offset) {
        span++;
      }
      const annotation = spans[span];
      let label = "plain";
      if (annotation && annotation.start <= offset && annotation.end > offset) {
        label = annotation.type;
      }
      const id = labels.indexOf(label);
      if (id < 0) {
        throw new Error(`Unknown label ${label}`);
      }
      if (character.trim()) {
        counts[id]!++;
      }
      offset += character.length;
    }
    targets.push(counts);
  }
  return targets;
}
