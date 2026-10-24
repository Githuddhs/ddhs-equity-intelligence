import { describe, expect, it } from "vitest";
import { addAppointment, pickPeriod, planHandoff } from "./recruitment-handoff";
import { blankFoundation, employeeGroup, uniqueProfiles, foundationSnapshot } from "./foundation";

const c = { full_name: "N. Dlamini", race: "African", gender: "Female", disability: false, foreign_national: false };
const v = { title: "HR Officer", occupational_level: "Skilled Technical", organisation: "Org", division: "Ops", department: "HR", section: "", province: "Western Cape" };
const h = { employeeId: "E100", startDate: "2026-03-01", contractType: "Permanent", workPattern: "Full-time", manager: "M1" };
const period = { ...blankFoundation(), period_start: "2025-10-01", period_end: "2026-09-30", snapshot_date: "2026-09-30" };

describe("recruitment handoff to Employee Profile", () => {
  it("creates one profile carrying the candidate's declared group and the vacancy's level", () => {
    const f = addAppointment(period, c, v, h);
    expect(f.employees).toHaveLength(1);
    expect(employeeGroup(f.employees[0]!)).toBe("FA");
    expect(f.employees[0]!.level).toBe("Skilled Technical");
    expect(f.movements[0]!.type).toBe("Recruitment");
    expect(foundationSnapshot(f).total_headcount).toBe(1);
  });
  it("refuses a staff number that already has a profile", () => {
    const f = addAppointment(period, c, v, h);
    expect(() => addAppointment(f, c, v, h)).toThrow(/already has an Employee Profile/);
    expect(uniqueProfiles(f.employees)).toHaveLength(1);
  });
  it("uses the period covering the start date, else the latest", () => {
    const ps = [{ period_start: "2024-10-01", period_end: "2025-09-30" }, { period_start: "2025-10-01", period_end: "2026-09-30" }];
    expect(pickPeriod(ps, "2025-01-01")).toBe(ps[0]);
    expect(pickPeriod(ps, "2027-01-01")).toBe(ps[1]);
    expect(pickPeriod([], "2026-01-01")).toBeNull();
  });
});

describe("planHandoff (server decision)", () => {
  const base = { stage: "appointed", handover: {}, periods: [period], toFoundation: (p: typeof period) => p, c, v, h };
  it("succeeds into the period covering the start date", () => {
    const r = planHandoff(base);
    expect(r.period).toBe(period);
    expect(r.outsidePeriod).toBe(false);
    expect(r.foundation.employees.map((e) => e.employeeId)).toEqual(["E100"]);
  });
  it("rejects a duplicate staff number", () => {
    const withE100 = addAppointment(period, c, v, h);
    expect(() => planHandoff({ ...base, periods: [withE100] })).toThrow(/already has an Employee Profile/);
  });
  it("rejects when no reporting period exists", () => {
    expect(() => planHandoff({ ...base, periods: [] })).toThrow(/reporting period first/);
  });
  it("rejects a repeat submission", () => {
    expect(() => planHandoff({ ...base, handover: { profile_sent_at: "2026-03-02T00:00:00Z" } })).toThrow(/already on the Employee Profile/);
  });
  it("rejects candidates who are not appointed", () => {
    expect(() => planHandoff({ ...base, stage: "interview" })).toThrow(/Only appointed/);
  });
});
