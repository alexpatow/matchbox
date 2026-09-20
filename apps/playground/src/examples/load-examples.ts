import type { ExampleLoader } from "./types.js";
export const loadMoney: ExampleLoader = async () => {
  const [model, report] = await Promise.all([
    import("../../../../examples/money/.matchbox/money/model.matchbox"),
    import("../../../../examples/money/.matchbox/money/report.json"),
  ]);
  return { default: model.default, report: report.default };
};
export const loadTime: ExampleLoader = async () => {
  const [model, report] = await Promise.all([
    import("../../../../examples/time/.matchbox/time/model.matchbox"),
    import("../../../../examples/time/.matchbox/time/report.json"),
  ]);
  return { default: model.default, report: report.default };
};
