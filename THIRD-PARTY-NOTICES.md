# Third-party components

## Fluid Functionalism

The button in `apps/playground/src/components/ui/button/` is adapted from [Fluid Functionalism](https://www.fluidfunctionalism.com/docs/button), created by [@micka_design](https://x.com/micka_design).

Source: <https://www.fluidfunctionalism.com/r/button.json>. Retrieved on 2026-09-13.

The adaptation preserves the registry's layered background, press effect, four surface variants, focus ring, and rounded default. It removes unused icon, loading, Slot, legacy-size, and provider APIs for this minimal example. It adds reduced-motion handling and splits styling from the React component to follow repository conventions.

Only dependencies used by the adapted component are installed. The wider registry's animation and icon dependencies are not required for this button subset.

The Inter variable font is supplied by `@fontsource-variable/inter`; its license is distributed with that dependency.

## Country reference data

The country names and English demonyms in `examples/filters/matchbox/filters/countries/countries.json` are derived from [mledoze/countries](https://github.com/mledoze/countries), retrieved 2026-09-13. The derived database is provided under ODbL 1.0; the license is included alongside the data. Shared demonyms prefer a unique independent country; unresolved ambiguous aliases and empty aliases are omitted.

## gpu-lexer research reference

The research-only affine prefix scan in `crates/matchbox-engine/examples/context-research/scan.rs` follows the algorithm in [gpu-lexer](https://github.com/vercel-labs/gpu-lexer), copyright Shu Ding, licensed under MIT. The TypeScript research adapter reads the original mechanical encoder from a separately supplied, pinned checkout; it does not bundle that encoder or any pretrained weights. The public Matchbox runtime is unchanged.

The upstream MIT license applies to the adapted scan:

> Copyright (c) 2026 Shu Ding
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
