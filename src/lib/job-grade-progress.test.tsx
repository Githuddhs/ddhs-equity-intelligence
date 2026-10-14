import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { blankFoundation, employeeSchema } from "@/lib/foundation";
import { ALL_UNITS } from "@/lib/org-units";
import { jobGradeGroups } from "./job-grade-progress";
import { JobGradeProgress } from "@/components/job-grade-progress";

const foundation = blankFoundation();
foundation.snapshot_date = "2026-10-14";
foundation.organisation.name = "Test organisation";
foundation.employees = [
  { employeeId: "1", gender: "Male", populationGroup: "African", jobGrade: "E1", division: "North" },
  { employeeId: "2", gender: "Female", populationGroup: "White", jobGrade: "E2", division: "North" },
  { employeeId: "3", gender: "Male", populationGroup: "White", jobGrade: "E1", division: "South" },
  { employeeId: "4", gender: "Male", populationGroup: "Indian", jobGrade: "E1", division: "North", endDate: "2026-10-14" },
  { employeeId: "5", gender: "Male", populationGroup: "African", jobGrade: "E1", division: "North", nationality: "Foreign" },
  { employeeId: "6", gender: "Female", populationGroup: "African", jobGrade: "", division: "North" },
].map((e) => employeeSchema.parse({ nationality: "South African", level: "Senior Management", gradingSystem: "Paterson", ...e }));

describe("Job-grade progress", () => {
  it("groups actual recorded grades and retains missing grades and foreign employees", () => {
    const groups = jobGradeGroups(foundation, "Senior Management");
    expect(groups.reduce((n, g) => n + g.total, 0)).toBe(5);
    expect(groups.find((g) => g.grade === "E1")?.counts.FNM).toBe(1);
    expect(groups.find((g) => g.grade === "Grade not recorded")?.total).toBe(1);
    expect(JSON.stringify(groups)).not.toContain("employeeId");
  });
  it("narrows all unit fields and occupational categories without grade inference", () => {
    const groups = jobGradeGroups(foundation, "Senior Management", { ...ALL_UNITS, organisation: "Test organisation", division: "North" });
    expect(groups.reduce((n, g) => n + g.total, 0)).toBe(4);
    expect(jobGradeGroups(foundation, "Top Management")).toEqual([]);
    expect(jobGradeGroups(foundation, "Senior Management", { ...ALL_UNITS, faculty: "Missing" })).toEqual([]);
  });
  it("uses provincial EAP and clearly labels occupational-only benchmarks", () => {
    const html = renderToStaticMarkup(<JobGradeProgress foundation={foundation} level="Senior Management" filter={ALL_UNITS} sector="Education" province="Gauteng" />);
    for (const text of ["E1", "E2", "76.6%", "94.2%", "Under-represented", "Grade not recorded", "not separate compliance targets", "5 employees"]) expect(html).toContain(text);
  });
  it("does not substitute national EAP or invent grade records", () => {
    const html = renderToStaticMarkup(<JobGradeProgress foundation={foundation} level="Senior Management" filter={ALL_UNITS} sector="Education" province="" />);
    expect(html).toContain("Province not set");
    expect(html).toContain("Unavailable");
    expect(html).not.toContain("94.2%");
    expect(renderToStaticMarkup(<JobGradeProgress level="Senior Management" filter={ALL_UNITS} sector="" province="" />)).toContain("Job-grade data unavailable for this snapshot");
  });
  it("uses the same percentage-point explanations for unit-filtered grade rows", () => {
    const html = renderToStaticMarkup(<JobGradeProgress foundation={foundation} level="Senior Management" filter={{ ...ALL_UNITS, division: "North" }} sector="Education" province="Gauteng" />);
    expect(html).toContain("4 employees");
    expect(html).toContain("What this means");
    expect(html).toContain("percentage points below provincial EAP");
    expect(html).toContain("percentage points above provincial EAP");
    expect(html).not.toContain("employeeId");
    const missing = renderToStaticMarkup(<JobGradeProgress foundation={foundation} level="Senior Management" filter={ALL_UNITS} sector="Education" province="" />);
    expect(missing).toContain("comparison unavailable because workforce headcount or provincial EAP is missing");
  });
});