import { createParser } from "@matchbox-ai/core/runtime";
import task from "../../../tests/fixtures/field-classifier/matchbox/money/parser";
import artifact from "../../../tests/fixtures/field-classifier/.matchbox/money/model.matchbox?raw";
export async function benchmarkRecord() {
  const parser = createParser(JSON.parse(artifact), task);
  try {
    return await parser.parse("around fifteen grand euros");
  } finally {
    parser.dispose();
  }
}
