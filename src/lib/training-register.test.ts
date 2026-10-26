import { describe, expect, it } from "vitest";
import { employeeSchema } from "./foundation";
import { skillsGrid, trainingRows } from "./training-register";

const emp = (id: string) => employeeSchema.parse({ employeeId: id, gender: "Female", nationality: "South African", populationGroup: "African", level: "Skilled Technical" });

describe("EEA2 skills development from training register", () => {
  it("counts each trained employee once, by level and group", () => {
    const rows = trainingRows([{ "Employee No": "E1", Course: "Excel" }, { "Employee No": "E1", Course: "Safety" }, { "Employee No": "E2", Course: "Excel" }]);
    const r = skillsGrid(rows, [emp("E1"), emp("E2")]);
    expect(r.trained).toBe(2);
    expect(r.grid["Skilled technical"]!.AF).toBe(2);
  });

  it("reports unknown employee numbers instead of counting them", () => {
    const r = skillsGrid(trainingRows([{ "Employee number": "X9", Course: "Excel" }]), [emp("E1")]);
    expect(r.trained).toBe(0);
    expect(r.missing[0]).toContain("X9");
  });
});
