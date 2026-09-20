# Sketch to shape

[Draw on the canvas](/examples#sketch-title), or inspect `examples/sketch` in the repository.

The example accepts `{ points: [{ x, y }, ...] }` and predicts a line, ellipse, rectangle, triangle or unknown class. Application geometry code fits an accepted prediction and restores canvas coordinates. Uncertain predictions and poor fits leave the original stroke unchanged.

## Pipeline

1. Validate between 2 and 4,096 finite points.
2. Center the stroke and scale both axes by its longest bounding-box dimension, preserving proportions.
3. Resample to 64 points at equal distances along the path.
4. Encode a soft 8×8 occupancy grid, endpoint distance and normalized path length.
5. Classify with a 32-unit Burn MLP.
6. Fit the predicted shape deterministically, reject poorly fitting strokes (and open strokes for closed shapes), and restore position and scale.

Lines use orthogonal least squares with endpoints projected onto the fitted axis. Ellipses and rectangles use an oriented minimum-area bounding box. Triangles use a maximum-area triple from 32 sampled points. Rotation is in radians. Fitting checks endpoint distance and RMS boundary error in normalized coordinates. These are explicit example policies, not Matchbox defaults. They are approximate fits, especially for skewed or overshooting strokes.

The model returns `{ kind }`. `recognize.ts` returns a validated shape with line endpoints, ellipse radii, rectangle dimensions, or three triangle vertices. It also preserves the ordinary `ok`/`uncertain` result contract. The model does not predict geometry.

## Run locally

From the repository root:

```sh
bun install
bun run dev
```

Visit `/examples#sketch-title`. To work only on its data and model:

```sh
bun examples/sketch/scripts/generate-data.ts
bun run matchbox train examples/sketch
bun run matchbox eval examples/sketch
```

Generated weights live in `examples/sketch/.matchbox/shapes/`. Training and build commands generate them before bundling. No weights are committed.

## Evaluation limits

This first corpus contains 3,000 synthetic training strokes, 400 validation strokes and 400 test strokes, with equal class counts. Splits use independent seeds and preserve existing evaluation files when training data is regenerated. Training varies size, position, orientation, aspect ratio, starting point, drawing direction and small coordinate perturbations. Unknown examples include open arcs, chevrons, spirals and zigzags.

The test split shares the generator family with training. It measures synthetic classification, not human drawing accuracy or the quality of fitted geometry. Mouse, touch and stylus drawings from independent people are still needed. Separately authored example strokes, transformation tests, rejection tests and browser drawing tests check integration.

Training reports record dataset hashes, classification accuracy, abstention, model bytes, training duration and native/WASM parity. See the [numeric feature contract](../primitives/feature-classifier.md) for authoring a different object-input task.
