import type { NumericEncoder } from "@matchbox-ai/core";
import type { Stroke } from "./parser";
import { normalize, resample } from "./geometry/normalize";
/** A soft 8×8 occupancy grid, plus endpoint distance and path length. */
const encoder: NumericEncoder<Stroke> = {
  size: 66,
  encode(stroke) {
    const points = resample(normalize(stroke.points).points);
    const grid = Array<number>(64).fill(0);
    for (const point of points) {
      const x = (point.x + 0.5) * 7,
        y = (point.y + 0.5) * 7;
      for (const column of [Math.floor(x), Math.floor(x) + 1]) {
        for (const row of [Math.floor(y), Math.floor(y) + 1]) {
          if (column >= 0 && column < 8 && row >= 0 && row < 8) {
            const weight = (1 - Math.abs(column - x)) * (1 - Math.abs(row - y));
            grid[row * 8 + column] = Math.min(1, grid[row * 8 + column]! + weight);
          }
        }
      }
    }
    const first = points[0]!,
      last = points.at(-1)!;
    const length = points
      .slice(1)
      .reduce(
        (sum, point, i) => sum + Math.hypot(point.x - points[i]!.x, point.y - points[i]!.y),
        0,
      );
    return [...grid, Math.hypot(last.x - first.x, last.y - first.y), Math.min(length / 8, 1)];
  },
};
export default encoder;
