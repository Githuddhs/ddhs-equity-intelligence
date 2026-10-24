import { activeAtSnapshot, employeeGroup, type Foundation } from "@/lib/foundation";
import { ALL_UNITS, matches, UNASSIGNED, type UnitFilter } from "@/lib/org-units";
import { emptyCounts, emptyWorkforce, type Counts } from "@/lib/workforce";

export type GradeGroup = { system: string; grade: string; counts: Counts; total: number };

/** Only aggregate headcounts leave this helper; no IDs, pay or disability fields. */
export function jobGradeGroups(f: Foundation, level: string, filter: UnitFilter = ALL_UNITS): GradeGroup[] {
  const groups = new Map<string, GradeGroup>();
  for (const e of uniqueProfiles(f.employees)) {
    if (e.level !== level || !activeAtSnapshot(e, f.snapshot_date)) continue;
    const key = employeeGroup(e);
    if (!key || !matches({ organisation: e.organisation || f.organisation.name || UNASSIGNED, faculty: e.faculty || UNASSIGNED, division: e.division || UNASSIGNED, department: e.department || UNASSIGNED, section: e.section || UNASSIGNED, counts: emptyWorkforce(), disability: {} }, filter)) continue;
    const system = e.gradingSystem || "System not recorded";
    const grade = e.jobGrade || "Grade not recorded";
    const id = JSON.stringify([system, grade]);
    const group = groups.get(id) ?? { system, grade, counts: emptyCounts(), total: 0 };
    group.counts[key]++;
    group.total++;
    groups.set(id, group);
  }
  return [...groups.values()].sort((a, b) => a.system.localeCompare(b.system) || a.grade.localeCompare(b.grade, undefined, { numeric: true }));
}