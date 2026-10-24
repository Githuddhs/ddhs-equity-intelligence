// Shared sector target data.
export type TargetKey = "top" | "senior" | "pqm" | "skilled";
export type Targets = { males: number; females: number; total: number };
const T = (males: number, females: number, total: number): Targets => ({ males, females, total });

// 5-Year Sectoral Numerical Targets, GN 6124 in Government Gazette 52514 of 15 April 2025.
// Per sector: Top Management, Senior Management, Professionally Qualified & Middle Management, Skilled Technical.
export const SECTORS: { name: string; targets: Record<TargetKey, Targets> }[] = [
  { name: "Accommodation and Food Service Activities", targets: { top: T(18.6, 38.1, 56.7), senior: T(32.2, 46.1, 78.3), pqm: T(38.6, 46.1, 84.7), skilled: T(49.8, 46.1, 95.9) } },
  { name: "Administrative and Support Activities", targets: { top: T(33.2, 36.7, 69.9), senior: T(42.3, 43.5, 85.8), pqm: T(49.2, 46.1, 95.3), skilled: T(49.8, 46.1, 95.9) } },
  { name: "Agriculture, Forestry & Fishing", targets: { top: T(13.2, 20.8, 34.0), senior: T(21.6, 31.0, 52.6), pqm: T(34.7, 41.7, 76.4), skilled: T(49.8, 44.0, 93.8) } },
  { name: "Arts, Entertainment and Recreation", targets: { top: T(35.1, 33.5, 68.6), senior: T(40.3, 43.8, 84.1), pqm: T(49.8, 46.1, 95.9), skilled: T(49.8, 46.1, 95.9) } },
  { name: "Construction", targets: { top: T(30.0, 24.8, 54.8), senior: T(38.3, 27.8, 66.1), pqm: T(46.7, 34.4, 81.1), skilled: T(49.8, 46.1, 95.9) } },
  { name: "Education", targets: { top: T(27.6, 46.1, 73.7), senior: T(30.5, 46.1, 76.6), pqm: T(43.0, 46.1, 89.1), skilled: T(49.8, 46.1, 95.9) } },
  { name: "Electricity, Gas, Steam and Air Conditioning Supply", targets: { top: T(31.7, 27.9, 59.6), senior: T(42.7, 39.5, 82.2), pqm: T(49.8, 46.1, 95.9), skilled: T(49.8, 46.1, 95.9) } },
  { name: "Financial and Insurance Activities", targets: { top: T(27.8, 35.3, 63.1), senior: T(31.7, 45.3, 77.0), pqm: T(40.7, 46.1, 86.8), skilled: T(49.5, 46.1, 95.6) } },
  { name: "Human Health and Social Work Activities", targets: { top: T(27.6, 43.7, 71.3), senior: T(39.8, 46.1, 85.9), pqm: T(49.8, 46.1, 95.9), skilled: T(49.8, 46.1, 95.9) } },
  { name: "Information and Communication", targets: { top: T(25.4, 31.2, 56.6), senior: T(28.6, 40.0, 68.6), pqm: T(37.9, 38.9, 76.8), skilled: T(46.0, 45.7, 91.7) } },
  { name: "Manufacturing", targets: { top: T(24.1, 25.0, 49.1), senior: T(32.4, 33.6, 66.0), pqm: T(40.4, 37.7, 78.1), skilled: T(49.8, 39.6, 89.4) } },
  { name: "Mining and Quarrying", targets: { top: T(33.1, 24.4, 57.5), senior: T(36.3, 28.2, 64.5), pqm: T(43.2, 34.4, 77.6), skilled: T(49.8, 36.9, 86.7) } },
  { name: "Professional, Scientific and Technical Activities", targets: { top: T(24.4, 38.1, 62.5), senior: T(29.9, 46.1, 76.0), pqm: T(35.9, 46.1, 82.0), skilled: T(49.8, 46.1, 95.9) } },
  { name: "Public Administration and Defence; Compulsory Social Security", targets: { top: T(49.8, 41.9, 91.7), senior: T(49.8, 46.1, 95.9), pqm: T(49.8, 46.1, 95.9), skilled: T(49.8, 46.1, 95.9) } },
  { name: "Real Estate Activities", targets: { top: T(18.9, 30.3, 49.2), senior: T(22.9, 46.1, 69.0), pqm: T(32.4, 46.1, 78.5), skilled: T(38.3, 46.1, 84.4) } },
  { name: "Transportation and Storage", targets: { top: T(32.2, 30.0, 62.2), senior: T(42.1, 35.9, 78.0), pqm: T(46.3, 40.7, 87.0), skilled: T(49.8, 41.4, 91.2) } },
  { name: "Water Supply, Sewerage, Waste Management and Remediation Activities", targets: { top: T(49.8, 35.9, 85.7), senior: T(49.8, 41.0, 90.8), pqm: T(49.8, 46.1, 95.9), skilled: T(49.8, 46.1, 95.9) } },
  { name: "Wholesale and Retail Trade; Repair of Motor Vehicles and Motorcycles", targets: { top: T(24.2, 27.5, 51.7), senior: T(35.0, 38.6, 73.6), pqm: T(42.2, 46.1, 88.3), skilled: T(48.1, 46.1, 94.2) } },
];
export const LEVEL_TO_TARGET_KEY: Partial<Record<string, TargetKey>> = {
  "Top Management": "top",
  "Senior Management": "senior",
  "Professionally Qualified": "pqm",
  "Skilled Technical": "skilled",
};

// EAP by province — Statistics South Africa, QLFS Q3 2024.
export const EAP_SOURCE_LABEL = "Stats SA QLFS Q3 2024";
export const SECTOR_TARGET_SOURCE_LABEL = "GN 6124, GG 52514 (15 Apr 2025)";
export const SECTOR_TARGET_PERIOD_LABEL = "2025–2029 gazetted 5-year targets";
export type EapKey = "MA" | "MC" | "MI" | "MW" | "FA" | "FC" | "FI" | "FW" | "FNM" | "FNF";
export const PROVINCE_EAP: Record<string, Record<EapKey, number>> = {
  "National": { MA: 43.5, MC: 4.6, MI: 1.7, MW: 4.1, FA: 37.5, FC: 4.2, FI: 1.0, FW: 3.4, FNM: 0, FNF: 0 },
  "Eastern Cape": { MA: 43.3, MC: 5.7, MI: 0.8, MW: 2.8, FA: 39.8, FC: 4.9, FI: 0.3, FW: 2.4, FNM: 0, FNF: 0 },
  "Free State": { MA: 50.6, MC: 1.6, MI: 0.3, MW: 2.1, FA: 41.8, FC: 1.9, FI: 0.0, FW: 1.7, FNM: 0, FNF: 0 },
  "Gauteng": { MA: 46.6, MC: 1.2, MI: 1.7, MW: 5.8, FA: 37.4, FC: 1.2, FI: 1.1, FW: 5.0, FNM: 0, FNF: 0 },
  "KwaZulu-Natal": { MA: 43.7, MC: 0.6, MI: 4.6, MW: 1.9, FA: 43.4, FC: 0.7, FI: 3.5, FW: 1.6, FNM: 0, FNF: 0 },
  "Limpopo": { MA: 51.1, MC: 0.1, MI: 0.3, MW: 2.0, FA: 44.9, FC: 0.0, FI: 0.0, FW: 1.6, FNM: 0, FNF: 0 },
  "Mpumalanga": { MA: 51.2, MC: 0.3, MI: 0.4, MW: 2.6, FA: 43.1, FC: 0.2, FI: 0.2, FW: 2.0, FNM: 0, FNF: 0 },
  "North West": { MA: 52.7, MC: 1.0, MI: 1.9, MW: 2.9, FA: 38.5, FC: 1.0, FI: 0.1, FW: 1.9, FNM: 0, FNF: 0 },
  "Northern Cape": { MA: 29.9, MC: 18.6, MI: 0.6, MW: 5.3, FA: 24.8, FC: 16.9, FI: 0.2, FW: 3.7, FNM: 0, FNF: 0 },
  "Western Cape": { MA: 22.5, MC: 22.4, MI: 0.8, MW: 7.2, FA: 20.7, FC: 19.8, FI: 0.6, FW: 6.0, FNM: 0, FNF: 0 },
};

/** Designated-group EAP target for a province: designated males, women, and all designated groups (%). */
export function eapTargets(province: string): Targets {
  const e = PROVINCE_EAP[province] ?? PROVINCE_EAP["National"]!;
  const r = (n: number) => Math.round(n * 10) / 10;
  const males = e.MA + e.MC + e.MI, females = e.FA + e.FC + e.FI + e.FW;
  return { males: r(males), females: r(females), total: r(males + females) };
}
