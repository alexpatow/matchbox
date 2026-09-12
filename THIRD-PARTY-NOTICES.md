# Third-party components

## Fluid Functionalism

The button in `examples/filters/src/components/ui/button/` is adapted from [Fluid Functionalism](https://www.fluidfunctionalism.com/docs/button), created by [@micka_design](https://x.com/micka_design).

Source: <https://www.fluidfunctionalism.com/r/button.json>. Retrieved on 2026-09-13.

The adaptation preserves the registry's layered background, press effect, four surface variants, focus ring, and rounded default. It removes unused icon, loading, Slot, legacy-size, and provider APIs for this minimal example. It adds reduced-motion handling and splits styling from the React component to follow repository conventions.

Only dependencies used by the adapted component are installed. The wider registry's animation and icon dependencies are not required for this button subset.

The Inter variable font is supplied by `@fontsource-variable/inter`; its license is distributed with that dependency.
