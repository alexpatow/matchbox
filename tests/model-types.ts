import filters from "../examples/filters/src/generated/filters.matchbox";
const result = await filters.parse("Swedish customers");
if (result.status === "ok" && "field" in result.value && result.value.field === "country") {
  const country: "SE" | "DE" | "US" | "NO" = result.value.value;
  // @ts-expect-error The generated import preserves the application's country enum.
  const wrong: "FR" = result.value.value;
  void [country, wrong];
}
