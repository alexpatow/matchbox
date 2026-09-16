import parser from "../../../tests/fixtures/recurrent-classifier/.matchbox/parts/model.matchbox";
export async function benchmarkRecurrent(gpu = false) {
  return {
    ordinary: await parser.parse("black?", { gpu }),
    partial: await parser.parse("black?", { allowPartial: true, gpu }),
    accepted: await parser.parse("silver!", { gpu }),
  };
}
