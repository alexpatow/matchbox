import type { Point } from "../parser";
import type { Shape } from "./shape";
/** Orthogonal least squares: project onto the dominant covariance axis. */
export function fitLine(points: readonly Point[]): Extract<Shape, { kind: "line" }> {
  const center = points.reduce(
    (sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }),
    { x: 0, y: 0 },
  );
  let xx = 0,
    xy = 0,
    yy = 0;
  for (const point of points) {
    const x = point.x - center.x,
      y = point.y - center.y;
    xx += x * x;
    xy += x * y;
    yy += y * y;
  }
  const angle = Math.atan2(2 * xy, xx - yy) / 2;
  const direction = { x: Math.cos(angle), y: Math.sin(angle) };
  const projected = points.map(
    (point) => (point.x - center.x) * direction.x + (point.y - center.y) * direction.y,
  );
  const restore = (distance: number) => ({
    x: center.x + distance * direction.x,
    y: center.y + distance * direction.y,
  });
  const start = restore(Math.min(...projected)),
    end = restore(Math.max(...projected));
  // Retain the user's drawing direction.
  if (projected[0]! > projected.at(-1)!) {
    return { kind: "line", start: end, end: start };
  }
  return { kind: "line", start, end };
}
