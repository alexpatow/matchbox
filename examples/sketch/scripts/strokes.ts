import type { Point } from "../matchbox/shapes/parser";
export type Kind = "ellipse" | "rectangle" | "triangle" | "line" | "unknown";
export function randomSource(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export function stroke(kind: Kind, random: () => number) {
  const rotation = random() * Math.PI * 2,
    start = random();
  const ratio = 0.4 + random() * 0.6,
    scale = 30 + random() * 250;
  const center = { x: random() * 500, y: random() * 350 };
  const backwards = random() > 0.5,
    count = 32 + Math.floor(random() * 33);
  const noise = 0.004 + random() * 0.018;
  const mode = Math.floor(random() * 4);
  const vertices: Point[] =
    kind === "triangle"
      ? [
          { x: 0, y: -0.5 },
          { x: 0.5, y: 0.5 },
          { x: -0.5, y: 0.5 },
        ]
      : [
          { x: -0.5, y: -0.5 },
          { x: 0.5, y: -0.5 },
          { x: 0.5, y: 0.5 },
          { x: -0.5, y: 0.5 },
        ];
  return Array.from({ length: count }, (_, index) => {
    let t = index / (count - 1);
    if (backwards) {
      t = 1 - t;
    }
    const phase = (t + start) % 1;
    let x: number, y: number;
    if (kind === "ellipse") {
      x = Math.cos(phase * Math.PI * 2) / 2;
      y = Math.sin(phase * Math.PI * 2) / 2;
    } else if (kind === "line") {
      x = t - 0.5;
      y = 0;
    } else if (kind === "unknown") {
      if (mode === 0) {
        x = t - 0.5;
        y = Math.sin(t * Math.PI * 6) * 0.3;
      } else if (mode === 1) {
        x = (Math.cos(t * Math.PI * 5) * t) / 2;
        y = (Math.sin(t * Math.PI * 5) * t) / 2;
      } else if (mode === 2) {
        x = Math.cos(t * Math.PI * 1.4) / 2;
        y = Math.sin(t * Math.PI * 1.4) / 2;
      } else {
        x = t - 0.5;
        y = Math.abs(t - 0.5) * 1.5 - 0.375;
      }
    } else {
      const side = phase * vertices.length;
      const a = vertices[Math.floor(side)]!,
        b = vertices[(Math.floor(side) + 1) % vertices.length]!;
      x = a.x + (b.x - a.x) * (side % 1);
      y = a.y + (b.y - a.y) * (side % 1);
    }
    x += (random() - 0.5) * noise;
    y = y * ratio + (random() - 0.5) * noise;
    return {
      x:
        Math.round((center.x + scale * (x * Math.cos(rotation) - y * Math.sin(rotation))) * 100) /
        100,
      y:
        Math.round((center.y + scale * (x * Math.sin(rotation) + y * Math.cos(rotation))) * 100) /
        100,
    };
  });
}
