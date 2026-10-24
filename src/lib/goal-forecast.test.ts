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
