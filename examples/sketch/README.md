# Sketch to shape

This example trains a small Burn classifier on object inputs and fits recognized strokes into editable geometry. Its canvas lives at `/examples` in the shared playground.

See the [example documentation](../../docs/examples/sketch.md) for the pipeline, commands and evaluation limits, and the [feature classifier contract](../../docs/primitives/feature-classifier.md) for the framework API.

The classifier is trained on synthetic strokes. Its measured accuracy does not establish accuracy on human drawings. Normalization, resampling, raster features, geometry fitting and rejection policies remain explicit application code.
