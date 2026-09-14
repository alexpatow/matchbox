import type { ExampleLoader } from "./types.js";
export const loadMoney: ExampleLoader = async () => {
  const [model, report] = await Promise.all([
    import("../../../../examples/money/.matchbox/money/model.matchbox"),
    import("../../../../examples/money/.matchbox/money/report.json"),
  ]);
  return { default: model.default, report: report.default };
};
export const loadParity: ExampleLoader = async () => {
  const [model, report] = await Promise.all([
    import("../../../../examples/is-even/.matchbox/is-even/model.matchbox"),
    import("../../../../examples/is-even/.matchbox/is-even/report.json"),
  ]);
  return { default: model.default, report: report.default };
};
