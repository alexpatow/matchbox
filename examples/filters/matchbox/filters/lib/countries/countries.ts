import data from "./countries.json";
import { tokenize } from "@matchbox-ai/core/internal";
export const countries = data;
export type CountryCode = keyof typeof data;
export const countryCodes = Object.keys(data) as [CountryCode, ...CountryCode[]];
const key = (text: string) =>
  tokenize(text, "words")
    .map((token) => token.key)
    .join(" ");
export const countryAliases = countryCodes
  .flatMap((code) =>
    [...countries[code].aliases, code]
      .filter((alias) => alias.trim().length > 0)
      .map((alias) => ({
        code,
        alias,
        keys: tokenize(alias, "words").map((token) => token.key),
        isCode: alias === code,
      })),
  )
  .sort((a, b) => b.keys.length - a.keys.length);
const byName = new Map(countryAliases.map(({ alias, code }) => [key(alias), code]));
export function normalizeCountry(text: string): CountryCode | null {
  return byName.get(key(text)) ?? null;
}
