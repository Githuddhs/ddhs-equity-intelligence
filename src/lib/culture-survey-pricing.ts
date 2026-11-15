/** Culture Survey fees in ZAR, excluding VAT, from the DDHS client pricing proposal. */
export const CULTURE_SURVEY_PACKAGES = [
  { name: "Culture Pulse Survey", population: "Up to 100", maxEmployees: 100, fee: 35000, from: false, highlight: "" },
  { name: "Culture Diagnostic Essential", population: "Up to 300", maxEmployees: 300, fee: 55000, from: false, highlight: "" },
  { name: "Culture & Inclusion Diagnostic Professional", population: "Up to 750", maxEmployees: 750, fee: 95000, from: false, highlight: "Recommended for medium and large organisations" },
  { name: "Culture & Employment Equity Intelligence", population: "Up to 1,500", maxEmployees: 1500, fee: 125000, from: false, highlight: "Recommended for designated employers" },
  { name: "Enterprise Culture Intelligence", population: "1,500+", maxEmployees: null, fee: 175000, from: true, highlight: "" },
] as const;

export const CULTURE_SURVEY_ADDONS = [
  ["Employee focus group", "R12,500 per group"],
  ["Four focus groups", "R45,000"],
  ["Executive workshop", "R25,000"],
  ["Additional divisional report", "R7,500"],
  ["Follow-up pulse survey", "R25,000–R45,000"],
  ["Senior advisory support", "R2,750 per hour"],
  ["Repeat survey after 12 months", "70%–80% of the original fee"],
] as const;

export const CULTURE_SUBSCRIPTIONS = [
  { name: "Essential", monthly: 12500, annual: 150000, from: false },
  { name: "Professional", monthly: 18500, annual: 222000, from: false },
  { name: "Enterprise", monthly: 25000, annual: 300000, from: true },
] as const;

export const CULTURE_SURVEY_FROM = Math.min(...CULTURE_SURVEY_PACKAGES.map((p) => p.fee));
export const zar = (n: number) => "R" + n.toLocaleString("en-ZA").replace(/\s|\u00a0/g, ",");
