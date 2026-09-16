import parser from "../../../tests/fixtures/recurrent-classifier/.matchbox/parts/model.matchbox";
export async function benchmarkRecurrent() {
  return {
    ordinary: await parser.parse("black?"),
    partial: await parser.parse("black?", { allowPartial: true }),
    accepted: await parser.parse("silver!"),
  };
}
