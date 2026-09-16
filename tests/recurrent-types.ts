import { useMatchbox } from "@matchbox-ai/core/react";
import parts from "./fixtures/recurrent-classifier/.matchbox/parts/model.matchbox";
import money from "../examples/money/.matchbox/money/model.matchbox";
const ordinary = await parts.parse("cat!");
const original: "ok" | "uncertain" = ordinary.status;
const partial = await parts.parse("cat!", { allowPartial: true });
if (partial.status === "partial") {
  const label: "word" | "separator" | undefined = partial.value[0]?.type;
  const start: number | undefined = partial.uncertainRanges[0]?.start;
  void [label, start];
}
function useTypeAssertions() {
  const recurrent = useMatchbox(() => Promise.resolve({ default: parts }));
  const standard = useMatchbox(() => Promise.resolve({ default: money }));
  void recurrent.parse("cat!", { allowPartial: true });
  // @ts-expect-error Existing parser calls do not accept partial-result options.
  void standard.parse("15 USD", { allowPartial: true });
  // @ts-expect-error Existing parser calls do not accept partial-result options.
  void money.parse("15 USD", { allowPartial: true });
}
void [original, useTypeAssertions];
const gpu = await parts.parse("cat!", { gpu: true });
const gpuStatus: "ok" | "uncertain" = gpu.status;
void gpuStatus;
void parts.parse("cat!", { gpu: true, allowPartial: true });
// @ts-expect-error GPU execution is currently limited to recurrent classifiers.
void money.parse("15 USD", { gpu: true });
const gpuOptions = { gpu: true, allowPartial: true };
const gpuPartial = await parts.parse("cat!", gpuOptions);
if (gpuPartial.status === "partial") {
  const ranges = gpuPartial.uncertainRanges;
  void ranges;
}
