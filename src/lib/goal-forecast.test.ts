import { describe, expect, it } from "vitest";
import { blankForecast, eapBenchmark, forecastLevel, sectorTarget } from "./goal-forecast";

const full = { ...blankForecast(), goal: "60", milestones: ["52", "54", "56", "58", "60"], vacancies: "2", retirements: "1", turnover: "1", appointments: "4", promotions: "1", transfers: "0", other: "0" };
const base = { headcount: 10, designated: 5, share: 50 };

describe("goal forecast", () => {
  it("never substitutes national EAP when province is missing", () => expect(eapBenchmark("")).toBeNull());
  it("has no sector target below skilled level", () => expect(sectorTarget("Wholesale and Retail Trade; Repair of Motor Vehicles and Motorcycles", "Semi-skilled")).toBeNull());
  it("projects headcount and designated people needed", () => {
    const r = forecastLevel("Semi-skilled", base, full, { province: "Gauteng", sector: "", years: 5 });
    expect(r.projected).toBe(13); // 10 - 2 exits + 5 inflows
    expect(r.designatedNeeded).toBe(4); // ceil(7.8 - 4)
    expect(r.feasible).toBe(true);
  });
  it("flags missing inputs instead of inventing them", () => {
    const r = forecastLevel("Top Management", undefined, blankForecast(), { province: "", sector: "", years: 5 });
    expect(r.projected).toBeNull();
    expect(r.missing.join()).toMatch(/baseline/);
    expect(r.missing.join()).toMatch(/five-year goal/);
  });
});
