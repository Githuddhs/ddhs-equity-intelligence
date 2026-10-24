import { describe, expect, it } from "vitest";
import { goalVariance } from "./goal-variance";
import { emptyContent } from "./ee-plan";
import type { Employee } from "./foundation";

const emp = (id: string, populationGroup: string, gender: string, nationality = "South African") =>
  ({ employeeId: id, populationGroup, gender, nationality, level: "Senior Management" } as Employee);
const goals = emptyContent().goals.map((g) => (g.level === "Senior Management" ? { ...g, total: "60", baseline: "40" } : g));
const employees = [emp("1", "African", "Male"), emp("2", "White", "Male"), emp("3", "White", "Female"), emp("4", "White", "Male"), emp("5", "Indian", "Male", "Indian")];

describe("goal variance", () => {
  it("counts white women as designated and foreign nationals as not", () => {
    const v = goalVariance(goals, employees, [
      { employeeId: "3", type: "Recruitment", date: "", previousLevel: "", newLevel: "Senior Management" },
      { employeeId: "5", type: "Recruitment", date: "", previousLevel: "", newLevel: "Senior Management" },
    ]).find((x) => x.level === "Senior Management")!;
    expect(v.hires.designated).toBe(1);
    expect(v.hires.share).toBe(50);
  });
  it("is behind when designated share of hires and promotions is below goal", () => {
    const v = goalVariance(goals, employees, [
      { employeeId: "1", type: "Recruitment", date: "", previousLevel: "", newLevel: "Senior Management" },
      { employeeId: "2", type: "Promotion", date: "", previousLevel: "Skilled Technical", newLevel: "Senior Management" },
    ]).find((x) => x.level === "Senior Management")!;
    expect(v.variance).toBe(-10);
    expect(v.status).toBe("behind");
  });
  it("reports no movements rather than a zero share", () => {
    const v = goalVariance(goals, employees, []).find((x) => x.level === "Senior Management")!;
    expect(v.status).toBe("no_movements");
    expect(v.variance).toBeNull();
  });
});
