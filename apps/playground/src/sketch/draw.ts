import type { Point } from "../../../../examples/sketch/matchbox/shapes/parser";
import type { Shape } from "../../../../examples/sketch/matchbox/shapes/geometry/shape";
import { boundary } from "../../../../examples/sketch/matchbox/shapes/geometry/boundary";
export type Drawing = { points: Point[]; shape?: Shape };
export function draw(
  canvas: HTMLCanvasElement,
  drawings: Drawing[],
  draft: Point[],
  originals: boolean,
) {
  const bounds = canvas.getBoundingClientRect(),
    ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(bounds.width * ratio);
  canvas.height = Math.round(bounds.height * ratio);
  const context = canvas.getContext("2d")!;
  context.scale(canvas.width / 1000, canvas.height / 600);
  context.lineCap = "round";
  context.lineJoin = "round";
  function path(points: Point[], color: string, width: number) {
    if (!points.length) {
      return;
    }
    context.strokeStyle = color;
    context.lineWidth = width;
    context.beginPath();
    context.moveTo(points[0]!.x, points[0]!.y);
    points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.stroke();
  }
  for (const drawing of drawings) {
    if (!drawing.shape || originals) {
      path(drawing.points, drawing.shape ? "#b9b9b2" : "#62625b", 3);
    }
    if (drawing.shape) {
      path(boundary(drawing.shape), "#141410", 4);
    }
  }
  path(draft, "#62625b", 3);
}
