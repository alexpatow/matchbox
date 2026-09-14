import { tokenize } from "@matchbox-ai/core/internal";
import { countryAliases } from "./aliases";
import type { CountryCode } from "./countries";
const key = (text: string) =>
  tokenize(text, "words")
    .map((token) => token.key)
    .join(" ");
const byName = new Map(countryAliases.map(({ alias, code }) => [key(alias), code]));
export function normalizeCountry(text: string): CountryCode | null {
  return byName.get(key(text)) ?? null;
}
