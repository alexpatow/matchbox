import type { Point } from "../parser";
import type { Shape } from "./shape";
export function boundary(shape: Shape): Point[] {
  if (shape.kind === "line") {
    return [shape.start, shape.end];
  }
  if (shape.kind === "triangle") {
    return [...shape.vertices, shape.vertices[0]];
  }
  const points =
    shape.kind === "rectangle"
      ? [
          { x: -shape.width / 2, y: -shape.height / 2 },
          { x: shape.width / 2, y: -shape.height / 2 },
          { x: shape.width / 2, y: shape.height / 2 },
          { x: -shape.width / 2, y: shape.height / 2 },
          { x: -shape.width / 2, y: -shape.height / 2 },
        ]
      : Array.from({ length: 65 }, (_, i) => ({
          x: Math.cos((i * Math.PI) / 32) * shape.radiusX,
          y: Math.sin((i * Math.PI) / 32) * shape.radiusY,
        }));
  return points.map((point) => ({
    x: shape.center.x + point.x * Math.cos(shape.rotation) - point.y * Math.sin(shape.rotation),
    y: shape.center.y + point.x * Math.sin(shape.rotation) + point.y * Math.cos(shape.rotation),
  }));
}
function segmentDistance(point: Point, a: Point, b: Point) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const fraction = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1)),
  );
  return Math.hypot(point.x - a.x - fraction * dx, point.y - a.y - fraction * dy);
}
export function fitError(points: readonly Point[], shape: Shape) {
  const outline = boundary(shape);
  const squared = points.map(
    (point) =>
      Math.min(...outline.slice(1).map((end, i) => segmentDistance(point, outline[i]!, end))) ** 2,
  );
  return Math.sqrt(squared.reduce((sum, value) => sum + value, 0) / points.length);
}
