// Organisation structure layer: headcount per organisation → faculty → division
// → department → section, read from per-employee HR uploads and rolled up for any unit.
import { LEVELS, emptyCounts, emptyWorkforce, normaliseDisability, normaliseWorkforce, type Workforce } from "@/lib/workforce";

export type OrgUnit = {
  organisation: string;
  faculty: string;
  division: string;
  department: string;
  section: string;
  counts: Workforce;
  disability: Record<string, number>;
};

export type UnitFilter = { organisation?: string; faculty?: string; division: string; department: string; section: string };
export const ALL_UNITS: UnitFilter = { organisation: "", faculty: "", division: "", department: "", section: "" };

export const UNASSIGNED = "Not specified";

export function normaliseUnits(raw: unknown): OrgUnit[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((u) => {
    if (!u || typeof u !== "object") return [];
    const o = u as Record<string, unknown>;
    return [{
      organisation: String(o["organisation"] ?? "") || UNASSIGNED,
      faculty: String(o["faculty"] ?? "") || UNASSIGNED,
      division: String(o["division"] ?? "") || UNASSIGNED,
      department: String(o["department"] ?? "") || UNASSIGNED,
      section: String(o["section"] ?? "") || UNASSIGNED,
      counts: normaliseWorkforce(o["counts"]),
      disability: normaliseDisability(o["disability"]),
    }];
  });
}

export const matches = (u: OrgUnit, f: UnitFilter) =>
  (!f.organisation || u.organisation === f.organisation) &&
  (!f.faculty || u.faculty === f.faculty) &&
  (!f.division || u.division === f.division) &&
  (!f.department || u.department === f.department) &&
  (!f.section || u.section === f.section);

export function aggregate(units: OrgUnit[], f: UnitFilter = ALL_UNITS) {
  const counts = emptyWorkforce();
  const disability: Record<string, number> = {};
  for (const u of units) {
    if (!matches(u, f)) continue;
    for (const l of LEVELS) {
      const row = u.counts[l] ?? emptyCounts();
      for (const [k, v] of Object.entries(row)) counts[l]![k as keyof typeof row] += v;
      if (u.disability[l]) disability[l] = (disability[l] ?? 0) + u.disability[l]!;
    }
  }
  return { counts, disability };
}

const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b));

const LEVEL_KEYS = ["organisation", "faculty", "division", "department", "section"] as const;
type LevelKey = (typeof LEVEL_KEYS)[number];

/** Filter that keeps only the levels above `k`. */
const above = (f: UnitFilter, k: LevelKey): UnitFilter => {
  const out: UnitFilter = { ...ALL_UNITS };
  for (const key of LEVEL_KEYS) { if (key === k) break; (out as Record<string, string>)[key] = f[key] ?? ""; }
  return out;
};

/** Linked options: each level narrows by every level above it. */
export function unitOptions(units: OrgUnit[], f: UnitFilter) {
  const opts = (k: LevelKey) => uniq(units.filter((u) => matches(u, above(f, k))).map((u) => u[k]));
  return {
    organisations: opts("organisation"),
    faculties: opts("faculty"),
    divisions: opts("division"),
    departments: opts("department"),
    sections: opts("section"),
  };
}

/** True when the upload actually carried this level (not all "Not specified"). */
export const hasLevel = (units: OrgUnit[], k: LevelKey) => units.some((u) => u[k] !== UNASSIGNED);

export const describeFilter = (f: UnitFilter) =>
  LEVEL_KEYS.map((k) => f[k]).filter(Boolean).join(" › ") || "Entire organisation";

/** One row per unit at the next level down from the current filter. */
export function breakdown(units: OrgUnit[], f: UnitFilter) {
  const present = LEVEL_KEYS.filter((k) => k === "division" || k === "department" || k === "section" || hasLevel(units, k));
  const field: LevelKey = present.find((k) => !f[k]) ?? "section";
  const names = uniq(units.filter((u) => matches(u, f)).map((u) => u[field]));
  return { field, rows: names.map((name) => ({ name, ...aggregate(units, { ...f, [field]: name }) })) };
}
