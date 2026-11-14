/** Proposed annual fees in ZAR; no VAT treatment has been specified. */
export const MANAGED_INTERVIEW_PRICING = [
  { minEmployees: 1, maxEmployees: 250, annualFee: 60000, label: "Up to 250" },
  { minEmployees: 251, maxEmployees: 1000, annualFee: 105000, label: "251–1,000" },
  { minEmployees: 1001, maxEmployees: 3000, annualFee: 165000, label: "1,001–3,000" },
  { minEmployees: 3001, maxEmployees: 5000, annualFee: 247500, label: "3,001–5,000" },
] as const;