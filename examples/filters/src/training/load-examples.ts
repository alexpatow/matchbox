import type { ExampleLoader } from "./types.js";
export const loadMoney: ExampleLoader = async () => {
  const [model, report] = await Promise.all([
    import("../../../money-pipeline/.matchbox/parser.matchbox"),
    import("../../../money-pipeline/.matchbox/parser.matchbox.report.json"),
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

export const loadSimpleMoney: ExampleLoader = async () => {
  const [model, report] = await Promise.all([
    import("../../../money-simple/.matchbox/parser.matchbox"),
    import("../../../money-simple/.matchbox/parser.matchbox.report.json"),
  ]);
  return { default: model.default, report: report.default };
};
