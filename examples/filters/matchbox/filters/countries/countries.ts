import data from "./countries.json";
export const countries = data;
export type CountryCode = keyof typeof data;
export const countryCodes = Object.keys(data) as [CountryCode, ...CountryCode[]];
