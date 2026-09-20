import { expect, test } from "bun:test";
import { defineParser, parseDatasets } from "@matchbox-ai/core";
import { encodeFeatures, inputKey } from "@matchbox-ai/core/internal";
import { z } from "zod";
import task from "../examples/sketch/matchbox/shapes/parser";
import encoder from "../examples/sketch/matchbox/shapes/encode";
import { normalize, resample } from "../examples/sketch/matchbox/shapes/geometry/normalize";
import { fitShape } from "../examples/sketch/matchbox/shapes/geometry/fit";
import { samples } from "../apps/playground/src/sketch/samples";
import model from "../examples/sketch/.matchbox/shapes/model";
import { recognize } from "../examples/sketch/matchbox/shapes/recognize";

test("object inputs retain validation, metadata and dataset diagnostics", () => {
  const input = {
    points: [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ],
  };
  expect(task.validateInput(input)).toEqual({ success: true, data: input });
  expect(task.toJSON().input.type).toBe("object");
  expect(task.validateInput({ points: [{ x: NaN, y: 2 }] }).success).toBe(false);
  const row = { input, output: { kind: "ellipse" } };
  const source = { source: "train.jsonl", text: JSON.stringify(row) };
  const parsed = parseDatasets(task, { formatVersion: 1, train: source, eval: source });
  expect(parsed.success).toBe(true);
  const bad = parseDatasets(task, {
    formatVersion: 1,
    train: {
      ...source,
      text: JSON.stringify({
        ...row,
        input: {
          points: [
            { x: "oops", y: 1 },
            { x: 1, y: 2 },
          ],
        },
      }),
    },
    eval: source,
  });
  expect(bad.success).toBe(false);
  if (!bad.success) {
    expect(bad.issues[0]!.path).toEqual(["input", "points", 0, "x"]);
  }
  expect(inputKey({ a: 1, b: [2, 3] })).toBe(inputKey({ b: [2, 3], a: 1 }));
  expect(inputKey({ a: [2, 3] })).not.toBe(inputKey({ a: [3, 2] }));
  expect(() =>
    defineParser({ input: z.object({ x: z.number() }), output: z.strictObject({}) }),
  ).toThrow(/strictObject/);
});

test("feature encoding rejects malformed dimensions and non-finite float32 data", () => {
  expect(() => encodeFeatures({ size: 2, encode: () => [1] }, {})).toThrow(/exactly 2/);
  expect(() => encodeFeatures({ size: 1, encode: () => [1e100] }, {})).toThrow(/finite/);
  expect(() => encodeFeatures({ size: 1, encode: () => [1] }, {}, 2)).toThrow(/dimensions/);
});

test("normalization preserves aspect ratio and removes translation and uniform scale", () => {
  const points = samples.rectangle;
  const transformed = points.map(({ x, y }) => ({ x: x * 3 + 400, y: y * 3 - 180 }));
  const a = encoder.encode({ points }),
    b = encoder.encode({ points: transformed });
  a.forEach((value, i) => expect(value).toBeCloseTo(b[i]!, 6));
  expect(
    normalize([
      { x: 0, y: 0 },
      { x: 20, y: 10 },
    ]).points,
  ).toEqual([
    { x: -0.5, y: -0.25 },
    { x: 0.5, y: 0.25 },
  ]);
  const degenerate = resample([
    { x: 1, y: 2 },
    { x: 1, y: 2 },
  ]);
  expect(degenerate.every((point) => point.x === 1 && point.y === 2)).toBe(true);
});

test("fitting restores canvas coordinates and rejects open or degenerate strokes", () => {
  const fit = fitShape(samples.rectangle, "rectangle")!;
  expect(fit.shape.kind).toBe("rectangle");
  if (fit.shape.kind === "rectangle") {
    expect(fit.shape.center.x).toBeGreaterThan(400);
    expect(fit.shape.width).toBeGreaterThan(200);
  }
  expect(
    fitShape(
      [
        { x: 1, y: 1 },
        { x: 1, y: 1 },
      ],
      "ellipse",
    ),
  ).toBeNull();
  expect(
    fitShape(
      [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ],
      "rectangle",
    ),
  ).toBeNull();
});

test("the trained numeric model recognizes authored strokes and preserves uncertainty", async () => {
  for (const [kind, points] of Object.entries(samples)) {
    const result = await recognize(model, { points });
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(String(result.value.kind)).toBe(kind);
    }
  }
  const result = await recognize(model, {
    points: Array.from({ length: 40 }, (_, i) => ({ x: i * 10, y: Math.sin(i * 0.6) * 100 })),
  });
  expect(result.status).toBe("uncertain");
  expect(result.value).toBeNull();
  const invalid = await model.parse({ points: [] });
  expect(invalid.status).toBe("uncertain");
});

test("input defaults are snapshotted and recursive input contracts are rejected", () => {
  let next = true;
  const configured = defineParser({
    input: z.strictObject({ flag: z.boolean().default(() => next) }),
    output: z.strictObject({ kind: z.string() }),
  });
  next = false;
  expect(configured.validateInput({})).toEqual({ success: true, data: { flag: true } });
  const recursive = z.strictObject({
    get children() {
      return z.array(recursive);
    },
  });
  expect(() => defineParser({ input: recursive, output: z.strictObject({}) })).toThrow(/recursive/);
});

test("line fitting preserves endpoints, direction and scale while rejecting curves", () => {
  const points = [
    { x: 500, y: 400 },
    { x: 400, y: 300 },
    { x: 300, y: 200 },
  ];
  const fitted = fitShape(points, "line")!;
  expect(fitted.shape.kind).toBe("line");
  if (fitted.shape.kind === "line") {
    expect(fitted.shape.start.x).toBeCloseTo(500);
    expect(fitted.shape.start.y).toBeCloseTo(400);
    expect(fitted.shape.end.x).toBeCloseTo(300);
    expect(fitted.shape.end.y).toBeCloseTo(200);
  }
  expect(fitShape(samples.ellipse, "line")).toBeNull();
  const vertical = fitShape(
    [
      { x: 20, y: 100 },
      { x: 20, y: 200 },
    ],
    "line",
  )!;
  expect(vertical.shape.kind).toBe("line");
  expect(
    fitShape(
      [
        { x: 20, y: 100 },
        { x: 20, y: 100 },
      ],
      "line",
    ),
  ).toBeNull();
});
