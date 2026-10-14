import { describe, expect, it } from "vitest";
import { planMatchesFilter, unitsForPlan } from "./plan-units";
import { ALL_UNITS, type OrgUnit } from "./org-units";
import { emptyWorkforce } from "./workforce";

const wf: OrgUnit[] = [{ organisation: "Employer", faculty: "Science", division: "Research", department: "Labs", section: "Chemistry", counts: emptyWorkforce(), disability: {} }];
describe("plan report unit scope", () => {
  it("keeps plan-only unit options without workforce data", () => {
    const plan = { division: "HR", department: "Recruitment", section: "" };
    expect(unitsForPlan(plan, [])[0]?.division).toBe("HR");
    expect(planMatchesFilter(plan, [], { ...ALL_UNITS, division: "HR" })).toBe(true);
  });
  it("honours organisation and faculty scope", () => {
    const plan = { division: "Research", department: "Labs", section: "" };
    expect(planMatchesFilter(plan, wf, { ...ALL_UNITS, faculty: "Science" })).toBe(true);
    expect(planMatchesFilter(plan, wf, { ...ALL_UNITS, faculty: "Arts" })).toBe(false);
    expect(planMatchesFilter(plan, wf, { ...ALL_UNITS, organisation: "Other" })).toBe(false);
  });
  it("does not infer organisation or faculty for unmatched or whole-organisation plans", () => {
    expect(planMatchesFilter({ division: "HR", department: "", section: "" }, wf, { ...ALL_UNITS, faculty: "Science" })).toBe(false);
    expect(planMatchesFilter({ division: "", department: "", section: "" }, wf, { ...ALL_UNITS, organisation: "Employer" })).toBe(false);
  });
});