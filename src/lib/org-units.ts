// Organisation structure layer: headcount per division → department → section,
// read from per-employee HR uploads and rolled up for any chosen unit.
import { LEVELS, emptyCounts, emptyWorkforce, normaliseDisability, normaliseWorkforce, type Workforce } from "@/lib/workforce";

export type OrgUnit = {
  division: string;
  department: string;
  section: string;
  counts: Workforce;
  disability: Record<string, number>;
};

export type UnitFilter = { division: string; department: string; section: string };
export const ALL_UNITS: UnitFilter = { division: "", department: "", section: "" };

export const UNASSIGNED = "Not specified";

export function normaliseUnits(raw: unknown): OrgUnit[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((u) => {
    if (!u || typeof u !== "object") return [];
    const o = u as Record<string, unknown>;
    return [{
      division: String(o.division ?? "") || UNASSIGNED,
      department: String(o.department ?? "") || UNASSIGNED,
      section: String(o.section ?? "") || UNASSIGNED,
      counts: normaliseWorkforce(o.counts),
      disability: normaliseDisability(o.disability),
    }];
  });
}

export const matches = (u: OrgUnit, f: UnitFilter) =>
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

/** Linked options: departments narrow by division, sections by department. */
export function unitOptions(units: OrgUnit[], f: UnitFilter) {
  return {
    divisions: uniq(units.map((u) => u.division)),
    departments: uniq(units.filter((u) => !f.division || u.division === f.division).map((u) => u.department)),
    sections: uniq(units.filter((u) => (!f.division || u.division === f.division) && (!f.department || u.department === f.department)).map((u) => u.section)),
  };
}

export const describeFilter = (f: UnitFilter) =>
  [f.division, f.department, f.section].filter(Boolean).join(" › ") || "Entire organisation";

/** One row per unit at the next level down from the current filter. */
export function breakdown(units: OrgUnit[], f: UnitFilter) {
  const field: keyof UnitFilter = !f.division ? "division" : !f.department ? "department" : "section";
  const names = uniq(units.filter((u) => matches(u, f)).map((u) => u[field]));
  return { field, rows: names.map((name) => ({ name, ...aggregate(units, { ...f, [field]: name }) })) };
}
