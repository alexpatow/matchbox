# Time example

Train a small model for elapsed durations, relative offsets, and today/tomorrow clock expressions. See [the example guide](../../docs/examples/time.md) for commands, output contracts, and limits.

The token model recognizes semantic parts. `matchbox/time/lib/` contains the explicit arithmetic and clock conversion. `scripts/generate-data.ts` generates training rows and aligned token labels; it never writes evaluation fixtures.

The initial local run used 1,642 training rows and 950 parameters in a 6,675-byte JSON artifact. It matched all 12 held-out positive cases and abstained on all 10 negative challenges. The small canonical-rule baseline matched 6 of 12 positives. These fixtures check held-out values within familiar phrase patterns, not general date-language coverage or superiority to a mature date parser. Re-run training for current measurements; `report.json` records the actual results and export parity.
