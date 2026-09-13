import type { CountryCode } from "../examples/filters/src/countries";
import filters from "../examples/filters/src/generated/filters.matchbox";
const result = await filters.parse("Swedish customers");
if (result.status === "ok" && "field" in result.value && result.value.field === "country") {
  const country: CountryCode = result.value.value;
  // @ts-expect-error The generated import preserves the application's country enum.
  const wrong: "ZZ" = result.value.value;
  void [country, wrong];
}
