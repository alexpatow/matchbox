import type { ExampleLoader } from "./types.js";
export const loadMoney: ExampleLoader = async () => {
  const [model, report] = await Promise.all([
    import("../../../money/src/generated/money.matchbox"),
    import("../../../money/src/generated/money.matchbox.report.json"),
  ]);
  return { default: model.default, report: report.default };
};
export const loadParity: ExampleLoader = async () => {
  const [model, report] = await Promise.all([
    import("../../../is-even/src/generated/is-even.matchbox"),
    import("../../../is-even/src/generated/is-even.matchbox.report.json"),
  ]);
  return { default: model.default, report: report.default };
};
