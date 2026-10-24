import { describe, expect, it } from "vitest";
import { blankForecast, fixedMilestones, eapBenchmark, forecastLevel, sectorTarget } from "./goal-forecast";

const full = { ...blankForecast(), goal: "60", milestones: ["52", "54", "56", "58", "60"], vacancies: "2", retirements: "1", turnover: "1", appointments: "4", promotions: "1", transfers: "0", other: "0" };
const base = { headcount: 10, designated: 5, share: 50 };

describe("goal forecast", () => {
  it("never substitutes national EAP when province is missing", () => expect(eapBenchmark("")).toBeNull());
  it("has no sector target below skilled level", () => expect(sectorTarget("Wholesale and Retail Trade; Repair of Motor Vehicles and Motorcycles", "Semi-skilled")).toBeNull());
  it("uses provincial EAP as the target for the two lowest levels", () => {
    expect(forecastLevel("Unskilled", base, full, { province: "Gauteng", sector: "", years: 5 }).target).toBe(eapBenchmark("Gauteng"));
    expect(forecastLevel("Semi-skilled", base, full, { province: "", sector: "", years: 5 }).target).toBeNull();
  });
  it("projects headcount and designated people needed", () => {
    const r = forecastLevel("Semi-skilled", base, full, { province: "Gauteng", sector: "", years: 5 });
    expect(r.projected).toBe(13); // 10 - 2 exits + 5 inflows
    expect(r.designatedNeeded).toBe(Math.max(0, Math.ceil((eapBenchmark("Gauteng")! / 100) * 13 - 4 - 1e-9)));
  });
  it("flags missing inputs instead of inventing them", () => {
    const r = forecastLevel("Top Management", undefined, blankForecast(), { province: "", sector: "", years: 5 });
    expect(r.projected).toBeNull();
    expect(r.missing.join()).toMatch(/baseline/);
    expect(r.missing.join()).toMatch(/sector target/);
  });
  it("fixes the five-year goal and year 5 to the provincial EAP for the two lowest levels", () => {
    const r = forecastLevel("Unskilled", base, full, { province: "Gauteng", sector: "", years: 5 });
    expect(r.goal).toBe(eapBenchmark("Gauteng"));
    expect(fixedMilestones(["1", "2", "3", "4", "99"], 80, 5)[4]).toBe("80");
  });
  it("flags earlier milestones above the fixed target", () => {
    const r = forecastLevel("Unskilled", base, { ...full, milestones: ["99", "", "", "", ""] }, { province: "Gauteng", sector: "", years: 5 });
    expect(r.missing.join()).toMatch(/above the provincial EAP maximum/);
  });
});

import { appointmentPlan } from "./goal-forecast";
describe("appointmentPlan", () => {
  it("rounds whole people down so no share exceeds the ceiling", () => {
    const p = appointmentPlan({ headcount: 20, designated: 10, share: 50 }, 85.8, 5);
    expect(p.required).toBe(7); // 17 of 20 = 85%; 18 would be 90%
    expect(p.perYear).toEqual([2, 2, 1, 1, 1]);
    expect(p.achievable).toBe(85);
    expect(p.exact).toBe(false);
    expect(p.nextShare).toBe(90);
    expect([...p.shares, p.achievable!].every((s) => s <= 85.8)).toBe(true);
  });
  it("reports an exact target when headcount allows it", () => {
    const p = appointmentPlan({ headcount: 10, designated: 5, share: 50 }, 80, 5);
    expect(p.required).toBe(3);
    expect(p.exact).toBe(true);
    expect(p.shares[4]).toBe(80);
  });
  it("separates additional hires from replacements and keeps them under the ceiling", () => {
    const p = appointmentPlan({ headcount: 2, designated: 1, share: 50 }, 69.9, 5);
    expect(p.required).toBe(0); // 2 of 2 = 100% > 69.9%
    expect(p.additional).toBe(1); // 2 of 3 = 66.6%
    expect(p.additionalShare).toBeLessThanOrEqual(69.9);
  });
  it("needs none when the profile already meets the target", () => {
    expect(appointmentPlan({ headcount: 10, designated: 10, share: 100 }, 92.8, 5).required).toBe(0);
  });
  it("is unavailable without a baseline or target", () => {
    expect(appointmentPlan(null, 69.9, 5).required).toBeNull();
    expect(appointmentPlan({ headcount: 4, designated: 2, share: 50 }, null, 5).required).toBeNull();
  });
});
