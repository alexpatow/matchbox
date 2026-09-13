import type { MatchboxParser } from "@matchbox-ai/core/runtime";
const baseline: MatchboxParser<{ even: boolean }> = {
  async parse(input) {
    if (!/^\d+$/.test(input))
      return { status: "uncertain", value: null, confidence: 0, reason: "Expected digits." };
    return { status: "ok", value: { even: BigInt(input) % 2n === 0n }, confidence: 1 };
  },
};
export default baseline;
