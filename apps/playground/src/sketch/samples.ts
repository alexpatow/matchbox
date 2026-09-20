import type { Point } from "../../../../examples/sketch/matchbox/shapes/parser";
function polygon(vertices: Point[]) {
  return vertices
    .flatMap((point, i) => {
      const next = vertices[(i + 1) % vertices.length]!;
      return Array.from({ length: 16 }, (_, j) => ({
        x: point.x + ((next.x - point.x) * j) / 16 + Math.sin(j * 2) * 2,
        y: point.y + ((next.y - point.y) * j) / 16 + Math.cos(j) * 2,
      }));
    })
    .concat([vertices[0]!]);
}
export const samples = {
  line: Array.from({ length: 40 }, (_, i) => ({
    x: 260 + i * 12,
    y: 190 + i * 5 + Math.sin(i * 0.9) * 3,
  })),
  ellipse: Array.from({ length: 65 }, (_, i) => ({
    x: 490 + Math.cos((i * Math.PI) / 32) * (175 + Math.sin(i) * 3),
    y: 295 + Math.sin((i * Math.PI) / 32) * (130 + Math.cos(i) * 3),
  })),
  rectangle: polygon([
    { x: 300, y: 170 },
    { x: 680, y: 180 },
    { x: 675, y: 430 },
    { x: 310, y: 415 },
  ]),
  triangle: polygon([
    { x: 500, y: 145 },
    { x: 700, y: 430 },
    { x: 295, y: 425 },
  ]),
};
