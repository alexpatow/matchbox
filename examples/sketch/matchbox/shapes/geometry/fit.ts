import type { Point } from "../parser";
import { normalize, resample } from "./normalize";
import { shapeSchema, type Shape } from "./shape";
import { fitLine } from "./line";
import { fitError } from "./boundary";
function fitBox(points: Point[], kind: "ellipse" | "rectangle"): Shape {
  let area = Infinity;
  let best = { x: 0, y: 0, width: 0, height: 0, rotation: 0 };
  for (let degree = 0; degree < 90; degree++) {
    const rotation = (degree * Math.PI) / 180,
      c = Math.cos(rotation),
      s = Math.sin(rotation);
    const xs = points.map((point) => point.x * c + point.y * s),
      ys = points.map((point) => -point.x * s + point.y * c);
    const left = Math.min(...xs),
      top = Math.min(...ys),
      width = Math.max(...xs) - left,
      height = Math.max(...ys) - top;
    if (width * height < area) {
      area = width * height;
      const x = left + width / 2,
        y = top + height / 2;
      best = { x: x * c - y * s, y: x * s + y * c, width, height, rotation };
    }
  }
  const center = { x: best.x, y: best.y };
  if (kind === "ellipse") {
    return {
      kind,
      center,
      radiusX: best.width / 2,
      radiusY: best.height / 2,
      rotation: best.rotation,
    };
  }
  return { kind, center, width: best.width, height: best.height, rotation: best.rotation };
}
function fitTriangle(points: Point[]): Shape {
  const samples = resample(points, 32);
  let area = -1;
  let vertices: [Point, Point, Point] = [samples[0]!, samples[1]!, samples[2]!];
  for (let i = 0; i < samples.length - 2; i++) {
    for (let j = i + 1; j < samples.length - 1; j++) {
      for (let k = j + 1; k < samples.length; k++) {
        const a = samples[i]!,
          b = samples[j]!,
          c = samples[k]!;
        const candidate = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
        if (candidate > area) {
          area = candidate;
          vertices = [a, b, c];
        }
      }
    }
  }
  return { kind: "triangle", vertices };
}
export function fitShape(
  input: readonly Point[],
  kind: "ellipse" | "rectangle" | "triangle" | "line",
) {
  const normalized = normalize(input),
    points = resample(normalized.points);
  const first = points[0]!,
    last = points.at(-1)!;
  if (
    normalized.scale < 1e-6 ||
    (kind !== "line" && Math.hypot(first.x - last.x, first.y - last.y) > 0.25)
  ) {
    return null;
  }
  let fitted: Shape;
  if (kind === "line") {
    fitted = fitLine(points);
  } else if (kind === "triangle") {
    fitted = fitTriangle(points);
  } else {
    fitted = fitBox(points, kind);
  }
  const error = fitError(points, fitted);
  if (error > (kind === "line" ? 0.035 : 0.07)) {
    return null;
  }
  const restore = (point: Point) => ({
    x: normalized.center.x + point.x * normalized.scale,
    y: normalized.center.y + point.y * normalized.scale,
  });
  let shape: Shape;
  if (fitted.kind === "line") {
    shape = { kind: "line", start: restore(fitted.start), end: restore(fitted.end) };
  } else if (fitted.kind === "triangle") {
    shape = { ...fitted, vertices: fitted.vertices.map(restore) as [Point, Point, Point] };
  } else if (fitted.kind === "rectangle") {
    shape = {
      ...fitted,
      center: restore(fitted.center),
      width: fitted.width * normalized.scale,
      height: fitted.height * normalized.scale,
    };
  } else {
    shape = {
      ...fitted,
      center: restore(fitted.center),
      radiusX: fitted.radiusX * normalized.scale,
      radiusY: fitted.radiusY * normalized.scale,
    };
  }
  const checked = shapeSchema.safeParse(shape);
  return checked.success ? { shape: checked.data, error } : null;
}
