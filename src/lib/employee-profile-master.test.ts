import { describe, expect, it } from "vitest";
import { applyMovements, blankFoundation, employeeSchema, movementSchema, validateFoundation } from "./foundation";

const base = () => ({ ...blankFoundation(), period_start: "2026-01-01", period_end: "2026-12-31", snapshot_date: "2026-12-31",
  employees: [employeeSchema.parse({ employeeId: "E1", level: "Skilled Technical", department: "Finance", startDate: "2020-01-01", employmentStatus: "Active" }),
              employeeSchema.parse({ employeeId: "E2", level: "Semi-skilled", startDate: "2021-01-01", employmentStatus: "Active", reportsTo: "E1" })] });

describe("Employee Profile is the master record", () => {
  it("a promotion updates the profile's level and position date", () => {
    const f = { ...base(), movements: [movementSchema.parse({ employeeId: "E1", type: "Promotion", date: "2026-03-01", previousLevel: "Skilled Technical", newLevel: "Professionally Qualified" })] };
    const e = applyMovements(f).foundation.employees[0]!;
    expect(e.level).toBe("Professionally Qualified");
    expect(e.positionDate).toBe("2026-03-01");
  });
  it("a transfer updates the department", () => {
    const f = { ...base(), movements: [movementSchema.parse({ employeeId: "E1", type: "Transfer", date: "2026-04-01", previousLevel: "Skilled Technical", newLevel: "Skilled Technical", newDepartment: "HR" })] };
    expect(applyMovements(f).foundation.employees[0]!.department).toBe("HR");
  });
  it("a termination sets the end date and Terminated status", () => {
    const f = { ...base(), movements: [movementSchema.parse({ employeeId: "E2", type: "Termination", date: "2026-06-30", previousLevel: "Semi-skilled", reason: "Resignation" })] };
    const e = applyMovements(f).foundation.employees[1]!;
    expect(e.endDate).toBe("2026-06-30");
    expect(e.employmentStatus).toBe("Terminated");
  });
  it("flags a reporting line to an unknown employee", () => {
    const f = base(); f.employees[1]!.reportsTo = "X9";
    expect(validateFoundation(f).warnings.some((w) => w.includes("X9"))).toBe(true);
  });
});
