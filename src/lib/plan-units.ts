import { ALL_UNITS, matches, UNASSIGNED, type OrgUnit, type UnitFilter } from "@/lib/org-units";
import { emptyWorkforce } from "@/lib/workforce";

export type PlanUnit = { division: string; department: string; section: string };
export function unitsForPlan(plan: PlanUnit, workforce: OrgUnit[]): OrgUnit[] {
  const named = Boolean(plan.division || plan.department || plan.section);
  const found = named ? workforce.filter((u) => matches(u, { ...ALL_UNITS, ...plan })) : [];
  if (found.length) return found;
  return [{ organisation: UNASSIGNED, faculty: UNASSIGNED, division: plan.division || UNASSIGNED,
    department: plan.department || UNASSIGNED, section: plan.section || UNASSIGNED, counts: emptyWorkforce(), disability: {} }];
}
export function planMatchesFilter(plan: PlanUnit, workforce: OrgUnit[], filter: UnitFilter) {
  if (filter.division && plan.division !== filter.division) return false;
  if (filter.department && plan.department !== filter.department) return false;
  if (filter.section && plan.section !== filter.section) return false;
  return !filter.organisation && !filter.faculty || unitsForPlan(plan, workforce).some((u) => matches(u, filter));
}