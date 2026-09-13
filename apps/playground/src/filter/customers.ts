import type { CountryCode } from "../../../../examples/filters/matchbox/filters/lib/countries";
export interface Customer {
  name: string;
  country: CountryCode;
  status: "active" | "inactive" | "churned";
  arr: number;
}
export const customers: Customer[] = [
  { name: "Northstar Studio", country: "SE", status: "active", arr: 125000 },
  { name: "Birch & Co", country: "SE", status: "active", arr: 42000 },
  { name: "Fjord Works", country: "NO", status: "active", arr: 88000 },
  { name: "Formhaus", country: "DE", status: "active", arr: 74000 },
  { name: "Juniper Labs", country: "US", status: "active", arr: 260000 },
  { name: "Sundby Design", country: "SE", status: "inactive", arr: 65000 },
  { name: "Atelier West", country: "DE", status: "churned", arr: 32000 },
  { name: "Pine Collective", country: "NO", status: "inactive", arr: 28000 },
];
