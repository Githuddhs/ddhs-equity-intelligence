import { describe, expect, it } from "vitest";
import { MANAGED_INTERVIEW_PRICING } from "./managed-interview-pricing";

describe("proposed managed interview annual fees", () => {
  it("charges R60,000 for up to 250 employees", () => {
    expect(MANAGED_INTERVIEW_PRICING[0]).toMatchObject({ maxEmployees: 250, annualFee: 60000 });
  });
  it("charges R105,000 for 251–1,000 employees", () => {
    expect(MANAGED_INTERVIEW_PRICING[1]).toMatchObject({ minEmployees: 251, maxEmployees: 1000, annualFee: 105000 });
  });
  it("charges R165,000 for 1,001–3,000 employees", () => {
    expect(MANAGED_INTERVIEW_PRICING[2]).toMatchObject({ minEmployees: 1001, maxEmployees: 3000, annualFee: 165000 });
  });
  it("charges R247,500 for 3,001–5,000 employees", () => {
    expect(MANAGED_INTERVIEW_PRICING[3]).toMatchObject({ minEmployees: 3001, maxEmployees: 5000, annualFee: 247500 });
  });
});