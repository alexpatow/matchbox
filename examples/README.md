# Examples

Each example has an explicit task and pipeline under matchbox/, separate training and evaluation data, and ignored .matchbox/ artifacts.

| Example | What it demonstrates                                              | Boundary                                                    |
| ------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| money   | Token recognition followed by an application-owned decoder.       | English number words below one hundred and four currencies. |
| filters | Natural-language queries converted to validated customer filters. | Explicit conjunctions and a constrained application schema. |
| is-even | A minimal learned classification sanity check.                    | Use modulo in actual applications.                          |

The finite-value classifier remains covered by tests/fixtures/field-classifier. The money example is also the CLI template; the package build copies its authored files so the two stay aligned.
