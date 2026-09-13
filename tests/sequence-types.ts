import money from "../examples/money-pipeline/.matchbox/money/model.matchbox";
import parity from "../examples/is-even/.matchbox/is-even/model.matchbox";
export async function checkSequenceTypes() {
  const result = await money.parse("€12.50");
  if (result.status === "ok") {
    const amount: number = result.value.amount;
    const currency: "EUR" | "USD" | "GBP" | "SEK" = result.value.currency;
    // @ts-expect-error The generated binding preserves the application-owned schema.
    const invalid: "JPY" = result.value.currency;
    void [amount, currency, invalid];
  }
  const even = await parity.parse("42");
  if (even.status === "ok") {
    const value: boolean = even.value.even;
    void value;
  }
}
