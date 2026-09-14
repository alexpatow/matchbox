import { tokenize } from "@matchbox-ai/core/internal";
import { countries, countryCodes } from "./countries";
/** Shared reference aliases for training supervision and runtime normalization. */
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
