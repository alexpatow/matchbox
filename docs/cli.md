# CLI

Use matchbox init money to add a task to the current app. Use --directory <path> to scaffold into another project. Both paths author parser.ts, pipeline.ts, training data, and independent validation/test data.

```sh
matchbox train money
matchbox eval money
matchbox parse money "fifteen euros"
matchbox inspect money "eleven grand"
matchbox info money
matchbox dev money
matchbox save money "dax euros" '{"amount":15,"currency":"EUR","approximate":false}'
```

A task argument can also be a project/task directory or config file. The name can be omitted when discovery finds exactly one task. Multiple tasks require a name. --config selects an explicit path and cannot be combined with a task argument. --json returns machine-readable output; --verbose shows training progress.

The interactive session supports /train, /eval, /inspect, /info, /save <JSON>, and /exit. Parsing never writes examples. Saving rejects held-out inputs, validates the supplied output, and writes only training data. Token pipelines may also require updating the application-owned annotation recipe.

Inspect exposes low-level recognition details for diagnosis. The application consumes only the typed parse result. Training errors and low confidence should lead to targeted data or pipeline investigation, not automatic insertion of normalization rules.
