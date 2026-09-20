import type { Point } from "../parser";
export function normalize(points: readonly Point[]) {
  const xs = points.map((point) => point.x),
    ys = points.map((point) => point.y);
  const minX = Math.min(...xs),
    minY = Math.min(...ys);
  const width = Math.max(...xs) - minX,
    height = Math.max(...ys) - minY;
  const scale = Math.max(width, height, 1e-9);
  const center = { x: minX + width / 2, y: minY + height / 2 };
  return {
    points: points.map((point) => ({
      x: (point.x - center.x) / scale,
      y: (point.y - center.y) / scale,
    })),
    center,
    scale,
  };
}
export function resample(points: readonly Point[], count = 64): Point[] {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    lengths.push(
      lengths[i - 1]! +
        Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.y - points[i - 1]!.y),
    );
  }
  const total = lengths.at(-1)!;
  let segment = 1;
  return Array.from({ length: count }, (_, index) => {
    const distance = (total * index) / (count - 1);
    while (segment < points.length - 1 && lengths[segment]! < distance) {
      segment++;
    }
    const a = points[segment - 1]!,
      b = points[segment]!;
    const span = lengths[segment]! - lengths[segment - 1]!;
    const fraction = span > 0 ? (distance - lengths[segment - 1]!) / span : 0;
    return { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction };
  });
}
