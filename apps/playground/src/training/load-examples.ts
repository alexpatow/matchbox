import type { ExampleLoader } from "./types.js";
export const loadMoney: ExampleLoader = async () => {
  const [model, report] = await Promise.all([
    import("../../../../examples/money-pipeline/.matchbox/money/model.matchbox"),
    import("../../../../examples/money-pipeline/.matchbox/money/report.json"),
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

export const loadSimpleMoney: ExampleLoader = async () => {
  const [model, report] = await Promise.all([
    import("../../../../examples/money-simple/.matchbox/money/model.matchbox"),
    import("../../../../examples/money-simple/.matchbox/money/report.json"),
  ]);
  return { default: model.default, report: report.default };
};
