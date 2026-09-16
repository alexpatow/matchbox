const assert = require("node:assert/strict");
const { resolve } = require("node:path");
const native = require(resolve(process.argv[2] || "packages/train/native.cjs"));
async function main() {
  const config = JSON.stringify({ vocabularySize: 4, labelCount: 2 });
  const inputs = Int32Array.from(Array.from({ length: 32 }, () => [0, 2, 0, 0, 3, 0]).flat());
  const labels = Int32Array.from(Array.from({ length: 32 }, () => [0, 1]).flat());
  const fitted = await native.fit(config, inputs, labels, () => {});
  const scores = native.predict(config, fitted.weights, Int32Array.from([0, 2, 0, 0, 3, 0]));
  assert(scores[0] > 0.9 && scores[3] > 0.9);
  const recordConfig = JSON.stringify({ vocabularySize: 2, fields: [2] });
  const records = Float32Array.from(Array.from({ length: 32 }, () => [1, 0, 0, 1]).flat());
  const record = await native.fitRecord(recordConfig, records, labels, () => {});
  assert(native.predictRecord(recordConfig, record.weights, Float32Array.from([1, 0]))[0] > 0.9);
  assert(native.predictRecord(recordConfig, record.weights, Float32Array.from([0, 1]))[1] > 0.9);
  const recurrentConfig = JSON.stringify({ featureCount: 3, labelCount: 2, maxParts: 16 });
  const features = new Int32Array(32);
  features[0] = 1;
  features[16] = 2;
  const supervision = {
    features,
    targets: Float32Array.from([1, 0, 0, 1]),
    offsets: Uint32Array.from([0, 2]),
  };
  const recurrent = await native.fitRecurrent(
    recurrentConfig,
    JSON.stringify({ epochs: 1, learningRate: 0.003, batchParts: 128 }),
    supervision,
    supervision,
    () => {},
  );
  const predictor = new native.RecurrentPredictor(recurrentConfig, recurrent.weights);
  const recurrentScores = predictor.predict(features);
  assert.equal(recurrentScores.length, 4);
  assert(recurrentScores.every(Number.isFinite));
  assert.throws(() => predictor.predict(Int32Array.from([-1])));
  console.log(`Native training and prediction passed on ${process.platform}-${process.arch}.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
