import { describe, expect, it } from "vitest";
import { blankMove, demographicImpact, moveMissing } from "@/lib/movement-plan";
import type { Employee } from "@/lib/foundation";

const emp = (id: string, populationGroup: string, gender: string, level: string): Employee => ({ employeeId: id, populationGroup, gender, nationality: "South African", disability: "", employmentStatus: "Active", employmentType: "", workPattern: "", startDate: "2020-01-01", positionDate: "", location: "", endDate: "", level, jobTitle: "", gradingSystem: "", jobGrade: "", organisation: "", faculty: "", division: "", department: "HR", section: "" });
const L = "Professionally Qualified";
const staff = [emp("1", "White", "Male", L), emp("2", "African", "Female", L)];

describe("movement plan", () => {
  it("flags a promotion without from level and group", () => {
    expect(moveMissing({ ...blankMove("Promotion"), level: L, count: "1" })).toEqual(["demographic group", "from level"]);
  });
  it("flags a recruitment funnel that increases", () => {
    expect(moveMissing({ ...blankMove(), level: L, group: "FA", count: "5", offers: "2" }).join()).toContain("must not increase");
  });
  it("applies recruitment and exits to projected designated share", () => {
    const r = demographicImpact(staff, "2025-01-01", [
      { ...blankMove(), level: L, group: "FA", count: "2" },
      { ...blankMove("Termination"), level: L, group: "MW", reason: "Retirement", count: "1" },
    ]).find((x) => x.level === L)!;
    expect([r.current, r.currentShare, r.projected, r.projectedShare]).toEqual([2, 50, 3, 100]);
  });
  it("ignores incomplete rows", () => {
    const r = demographicImpact(staff, "2025-01-01", [{ ...blankMove(), level: L, count: "3" }]).find((x) => x.level === L)!;
    expect(r.netChange).toBe(0);
  });
});

import { yearlyProjection } from "@/lib/movement-plan";
describe("yearly projection", () => {
  it("accumulates movements by year and flags years below the manual goal", () => {
    const moves = [{ ...blankMove(), year: "2", level: L, group: "FA", count: "2" }];
    const ms = { [L]: ["60", "60"] };
    const p = yearlyProjection(staff, "2025-01-01", moves, 2, ms).find((x) => x.level === L)!;
    expect(p.years.map((y) => [y.projectedShare, y.status, y.gap])).toEqual([[50, "below", -10], [75, "meets", 15]]);
    expect(ms[L]).toEqual(["60", "60"]);
    expect(p.sources).toHaveLength(1);
  });
});
